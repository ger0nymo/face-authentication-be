import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { PrismaService } from "src/prisma/prisma.service";
import { FaceAuthService } from "../../face-auth/face-auth.service";

@Injectable()
export class FaceAuthGuard implements CanActivate {
  constructor(private readonly faceAuthService: FaceAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request: Request = context.switchToHttp().getRequest();

      const payload = await this.faceAuthService.verifyVerificationToken(
        request.header("Authorization").split(" ")[1],
      );

      console.log("So far so good", payload);
      request.user = payload;

      return true;
    } catch (err: unknown) {
      throw new UnauthorizedException();
    }
  }
}
