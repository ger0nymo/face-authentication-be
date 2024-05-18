import {
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  Get,
  Res,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";

import { UserService } from "./user.service";
import { SignInDto } from "./dto/SignIn.dto";
import { Request, Response } from "express";
import { User } from "@prisma/client";
import { AuthGuard } from "src/guards/auth/auth.guard";
import { RemovePasswordInterceptor } from "src/interceptors/remove-password/remove-password.interceptor";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("auth/sign-up")
  async signUp(
    @Body() newUser: SignInDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const { user, token }: { user: Partial<User>; token: string } =
        await this.userService.signUp(newUser);

      delete user.password;

      res.status(201).send({ user: user, token: token });
    } catch (err: unknown) {
      throw new InternalServerErrorException(err);
    }
  }

  @Post("auth/sign-in")
  async signIn(@Body() credentials: SignInDto, @Res() res: Response) {
    try {
      const { user, token }: { user: Partial<User>; token: string } =
        await this.userService.signIn(credentials);

      delete user.password;

      res.status(200).send({ user: user, token: token });
    } catch (err: unknown) {
      throw new InternalServerErrorException(err);
    }
  }

  @UseGuards(AuthGuard)
  @Post("auth/revoke-token")
  async revokeToken(@Req() req: Request): Promise<{ revoked: boolean }> {
    return { revoked: await this.userService.revokeToken(req.user.jti) };
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(RemovePasswordInterceptor)
  @Get()
  async getMe(@Req() req: Request): Promise<{ user: User }> {
    try {
      return { user: await this.userService.getById(req.user.sub) };
    } catch (err: unknown) {
      throw new InternalServerErrorException(err);
    }
  }

  @UseGuards(AuthGuard)
  @Post("/disable-face-verification")
  async disableFaceVerification(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.userService.disableFaceVerification(req.user.sub);

      res.status(200).send();
    } catch (err: unknown) {
      res.status(500).send(err.toString());
      throw new InternalServerErrorException(err);
    }
  }

  // TODO: Create it's own module
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  @Post("/image/image-embedding")
  async imageEmbedding(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.userService.imageEmbedding(file, req.user.sub);

      res.status(200).send();
    } catch (err: unknown) {
      if (err.toString().includes("Multiple")) {
        res.status(450).send("Your image contains multiple faces.");
        return;
      } else if (err.toString().includes("No faces detected")) {
        res.status(451).send("No face detected in your image.");
        return;
      }
      res.status(500).send(err.toString());
      throw new InternalServerErrorException(err);
    }
  }

  // TODO: Create it's own module
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  @Post("image/compare-faces")
  async compareFaces(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const similarity: number = await this.userService.compareFaces(
        file,
        req.user.sub,
      );

      console.log("Cosine similarity: ", similarity);

      if (similarity >= 0.6) {
        res.status(200).send("The faces are similar.");
      } else {
        res.status(452).send("The faces are not similar.");
      }
    } catch (err: unknown) {
      if (err.toString().includes("Multiple")) {
        res.status(450).send("Your image contains multiple faces.");
        return;
      } else if (err.toString().includes("No faces detected")) {
        res.status(451).send("No face detected in your image.");
        return;
      }
      res.status(500).send(err.toString());
      throw new InternalServerErrorException(err);
    }
  }
}
