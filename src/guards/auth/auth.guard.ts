import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { PrismaService } from "src/prisma/prisma.service";

import { JwtPayload } from "src/contracts/jwt-payload/jwt-payload.interface";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request: Request = context.switchToHttp().getRequest();

      const payload: JwtPayload = await this.jwtService.verifyAsync(
        request.header("Authorization").split(" ")[1],
        { secret: process.env.JWT_SECRET },
      );

      if (
        await this.prisma.revokedToken.findUnique({
          where: { jti: payload.jti },
        })
      )
        throw new UnauthorizedException();

      request.user = payload;

      return true;
    } catch (err: unknown) {
      throw new UnauthorizedException();
    }
  }
}
