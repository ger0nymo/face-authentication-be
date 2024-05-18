import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class FaceAuthService {
  constructor(private jwtService: JwtService) {}

  async generateVerificationToken(id: string) {
    return await this.jwtService.signAsync(
      {},
      { jwtid: uuidv4(), subject: id },
    );
  }

  verifyVerificationToken(token: string) {
    console.log("Verifying token:", token);
    return this.jwtService.verifyAsync(token, {
      secret: process.env.FACE_AUTH_SECRET,
    });
  }
}
