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

@Injectable()
export class UserService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
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

    return { user, token };
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
}
