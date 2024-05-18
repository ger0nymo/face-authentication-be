import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { FaceAuthService } from "./face-auth.service";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.FACE_AUTH_SECRET,
      signOptions: { expiresIn: "15s" },
    }),
  ],
  providers: [FaceAuthService],
  exports: [FaceAuthService],
})
export class FaceAuthModule {}
