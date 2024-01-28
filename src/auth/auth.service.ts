import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  signup() {
    return "I'm signed up";
  }

  login() {
    return "I'm logged in";
  }
}
