import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { SignInDto } from "./dto/SignIn.dto";
import { JwtService } from "@nestjs/jwt";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcrypt";
import { lastValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { FaceAuthService } from "../face-auth/face-auth.service";
import { JwtPayload } from "../contracts/jwt-payload/jwt-payload.interface";

@Injectable()
export class UserService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly faceAuthService: FaceAuthService,
  ) {}

  async signUp(user: SignInDto) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        ...user,
        password: hashedPassword,
        fv: [],
      },
    });

    const token = await this.jwtService.signAsync(
      {},
      { jwtid: uuidv4(), subject: newUser.id },
    );

    return { user: newUser, token };
  }

  async signInAfterFaceVerification(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException("User not found");

    const token = await this.jwtService.signAsync(
      {},
      { jwtid: uuidv4(), subject: user.id },
    );

    return { user, token };
  }

  async signIn(credentials: SignInDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: credentials.email },
    });

    if (!user) throw new NotFoundException("User not found");

    const isPasswordValid = await this.comparePassword(
      credentials.password,
      user.password,
    );

    if (!isPasswordValid) throw new UnauthorizedException("Invalid password");

    console.log(credentials.password, user.password, isPasswordValid);

    const token = await this.jwtService.signAsync(
      {},
      { jwtid: uuidv4(), subject: user.id },
    );

    if (user.fv.length === 0) return { user, token };

    const faceToken = await this.faceAuthService.generateVerificationToken(
      user.id,
    );

    console.log(faceToken);

    return { user, faceToken };
  }

  async revokeToken(jti: string) {
    await this.prisma.revokedToken.create({ data: { jti } });

    return true;
  }

  async getById(id: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id } });
  }

  private async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  async disableFaceVerification(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { fv: [] },
    });
  }

  // TODO: Create it's own module
  async imageEmbedding(
    file: Express.Multer.File,
    id: string,
  ): Promise<number[]> {
    // Get the image file from request body. Request body is type form-data. The image file is in the field 'image'.
    const image = file.buffer;

    try {
      const formData = new FormData();
      const imageBlob = new Blob([image], { type: file.mimetype });
      formData.append("image", imageBlob, file.originalname);

      // Send the image to the image embedding service at localhost:5000/image-embedding with an api key key: super-secret-api-key
      const response = this.httpService.post(
        "http://0.0.0.0:5000/image-embedding",
        formData,
        {
          headers: {
            key: "super-secret-api-key", // Obviously in a real application this would be stored in an environment variable
          },
        },
      );

      const { data } = await lastValueFrom(response);

      console.log(data);

      if (data.fv) {
        await this.prisma.user.update({
          where: { id },
          data: { fv: data.fv },
        });

        return data.fv;
      } else {
        throw Error(data.error);
      }
    } catch (err: unknown) {
      throw new Error(err.toString());
    }
  }

  // TODO: Create it's own module
  async compareFaces(
    file: Express.Multer.File,
    payload: JwtPayload,
  ): Promise<number> {
    const image = file.buffer;

    try {
      const formData = new FormData();
      const imageBlob = new Blob([image], { type: file.mimetype });
      formData.append("image", imageBlob, file.originalname);

      console.log("User from service: ", payload);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) throw new NotFoundException("User not found");

      formData.append("fv", JSON.stringify(user.fv));

      const response = this.httpService.post(
        "http://0.0.0.0:5000/compare-faces",
        formData,
        {
          headers: {
            key: "super-secret-api-key",
          },
        },
      );

      const { data } = await lastValueFrom(response);

      if (data.error) {
        throw new Error(data.error);
      }

      return data.cosine_similarity;
    } catch (err: unknown) {
      console.log(err);
      throw new Error(err.toString());
    }
  }
}
