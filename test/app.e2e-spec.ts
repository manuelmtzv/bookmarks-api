import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as pactum from "pactum";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { AuthDto } from "../src/auth/dto";
import { EditUserDto } from "../src/user/dto";
import { CreateBookmarkDto } from "../src/bookmark/dto";

describe("App e2e", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    await app.init();
    await app.listen(3000);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl("http://localhost:3000");
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Auth", () => {
    const dto: AuthDto = {
      email: "manuel.mtzv816@gmail.com",
      password: "nachHD816$",
    };

    describe("Signup", () => {
      it("Should throw error if email empty", () => {
        return pactum
          .spec()
          .post("/auth/signup")
          .withBody({ password: dto.password })
          .expectStatus(400);
      });

      it("Should throw error if password empty", () => {
        return pactum
          .spec()
          .post("/auth/signup")
          .withBody({ email: dto.email })
          .expectStatus(400);
      });

      it("Should throw if body empty", () => {
        return pactum.spec().post("/auth/signup").expectStatus(400);
      });

      it("Should signup", () => {
        return pactum
          .spec()
          .post("/auth/signup")
          .withBody(dto)
          .expectStatus(201)
          .stores("userAt", "access_token");
      });
    });

    describe("Login", () => {
      it("Should throw error if email empty", () => {
        return pactum
          .spec()
          .post("/auth/login")
          .withBody({ password: dto.password })
          .expectStatus(400);
      });

      it("Should throw error if password empty", () => {
        return pactum
          .spec()
          .post("/auth/login")
          .withBody({ email: dto.email })
          .expectStatus(400);
      });

      it("Should throw if body empty", () => {
        return pactum.spec().post("/auth/login").expectStatus(400);
      });

      it("Should login", () => {
        return pactum
          .spec()
          .post("/auth/login")
          .withBody(dto)
          .expectStatus(200)
          .stores("userAt", "access_token");
      });
    });
  });

  describe("User", () => {
    describe("Get me", () => {
      it("Should throw if no token", () => {
        return pactum.spec().get("/users/me").expectStatus(401);
      });

      it("Should get current user", () => {
        return pactum
          .spec()
          .get("/users/me")
          .withBearerToken(`$S{userAt}`)
          .expectStatus(200);
      });
    });

    describe("Edit user", () => {
      it("Should throw if no token", () => {
        return pactum.spec().patch("/users").expectStatus(401);
      });

      it("Should edit user", () => {
        const dto: EditUserDto = {
          firstName: "Manuel",
          lastName: "Martinez",
        };
        return pactum
          .spec()
          .patch("/users")
          .withBearerToken(`$S{userAt}`)
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.lastName);
      });
    });
  });

  describe("Bookmarks", () => {
    describe("Get no bookmarks", () => {
      it("Should get empty array", () => {
        return pactum
          .spec()
          .get("/bookmarks")
          .withBearerToken("$S{userAt}")
          .expectStatus(200)
          .expectBodyContains([]);
      });
    });

    describe("Create bookmark", () => {
      const dto: CreateBookmarkDto = {
        title: "Mangocatnotes bookmark",
        link: "https://mangocatnotes.vercel.app",
      };

      it("Should throw if no token", () => {
        return pactum.spec().post("/bookmarks").expectStatus(401);
      });

      it("Should throw if title empty", () => {
        return pactum
          .spec()
          .post("/bookmarks")
          .withBearerToken("$S{userAt}")
          .withBody({ link: dto.link })
          .expectStatus(400);
      });

      it("Should throw if link empty", () => {
        return pactum
          .spec()
          .post("/bookmarks")
          .withBearerToken("$S{userAt}")
          .withBody({ title: dto.title })
          .expectStatus(400);
      });

      it("Should create bookmark", () => {
        return pactum
          .spec()
          .post("/bookmarks")
          .withBearerToken("$S{userAt}")
          .withBody(dto)
          .expectStatus(201)
          .stores("bookmarkId", "id");
      });
    });

    describe("Get bookmarks", () => {
      it("Should throw if no token", () => {
        return pactum.spec().get("/bookmarks").expectStatus(401);
      });

      it("Should get bookmarks", () => {
        return pactum
          .spec()
          .get("/bookmarks")
          .withBearerToken("$S{userAt}")
          .expectStatus(200);
      });
    });

    describe("Get bookmark by id", () => {
      it("Should throw if no token", () => {
        return pactum
          .spec()
          .get("/bookmarks/{id}")
          .withPathParams("id", "$S{bookmarkId}")
          .expectStatus(401);
      });

      it("Should get bookmark by id", () => {
        return pactum
          .spec()
          .get("/bookmarks/{id}")
          .withPathParams("id", "$S{bookmarkId}")
          .withBearerToken(`$S{userAt}`)
          .expectStatus(200)
          .inspect();
      });
    });

    describe("Update bookmark", () => {
      const dto = {
        title: "Mangocatnotes bookmark updated",
        link: "https://mangocatnotes.vercel.app",
      };
      it("Should throw if no token", () => {
        return pactum
          .spec()
          .patch("/bookmarks/{id}")
          .withPathParams("id", "$S{bookmarkId}")
          .expectStatus(401);
      });

      it("Should throw if id not found", () => {
        return pactum
          .spec()
          .patch("/bookmarks/{id}")
          .withPathParams("id", "0")
          .withBearerToken(`$S{userAt}`)
          .withBody(dto)
          .expectStatus(404);
      });

      it("Should update bookmark", () => {
        return pactum
          .spec()
          .patch("/bookmarks/{id}")
          .withPathParams("id", "$S{bookmarkId}")
          .withBearerToken(`$S{userAt}`)
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.link);
      });
    });

    describe("Delete bookmark", () => {
      it("Should throw if no token", () => {
        return pactum
          .spec()
          .delete("/bookmarks/{id}")
          .withPathParams("id", "$S{bookmarkId}")
          .expectStatus(401);
      });

      it("Should throw if id not found", () => {
        return pactum
          .spec()
          .delete("/bookmarks/{id}")
          .withPathParams("id", "0")
          .withBearerToken(`$S{userAt}`)
          .expectStatus(404);
      });

      it("Should delete bookmark", () => {
        return pactum
          .spec()
          .delete("/bookmarks/{id}")
          .withPathParams("id", "$S{bookmarkId}")
          .withBearerToken(`$S{userAt}`)
          .expectStatus(204);
      });

      it("Should get empty array", () => {
        return pactum
          .spec()
          .get("/bookmarks")
          .withBearerToken("$S{userAt}")
          .expectStatus(200)
          .expectBodyContains([]);
      });
    });
  });

  it.todo("Should pass");
});
