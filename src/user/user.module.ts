import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { HttpModule } from "@nestjs/axios";
import { FaceAuthModule } from "../face-auth/face-auth.module";

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [PrismaModule, HttpModule, FaceAuthModule],
})
export class UserModule {}
