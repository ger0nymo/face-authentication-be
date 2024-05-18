import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { HttpModule } from "@nestjs/axios";

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [PrismaModule, HttpModule],
})
export class UserModule {}
