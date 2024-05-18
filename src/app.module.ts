import { Module } from "@nestjs/common";
import { UserModule } from "./user/user.module";
import { PrismaService } from "./prisma/prisma.service";
import { JwtModule } from "@nestjs/jwt";
import { HttpModule } from "@nestjs/axios";
import { FaceAuthModule } from "./face-auth/face-auth.module";

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "2h" },
    }),
    UserModule,
    HttpModule,
    FaceAuthModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
