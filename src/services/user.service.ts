import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import moment from 'moment';
import { SignInDto, SignUpDto, UpdatePasswordDto } from 'src/dto/user.dto';
import { User } from 'src/models/user.model';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  async signup(user: SignUpDto, jwt: JwtService): Promise<{ info: User; token: string }> {
    if (!user.firstName || !user.lastName || !user.email || !user.password) {
      throw new HttpException('Name, email, and password are required', HttpStatus.BAD_REQUEST);
    }

    const existingUser = await this.prismaService.credentials.findUnique({
      where: { email: user.email },
    });
    if (existingUser) {
      throw new HttpException('Email is already in use', HttpStatus.BAD_REQUEST);
    }

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(user.password, salt);
    const createdAt = moment().format('X');
    const savedUser = await this.prismaService.user.create({
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt,
      },
    });
    const savedCredentials = await this.prismaService.credentials.create({
      data: {
        email: user.email,
        password: hash,
        user: {
          connect: {
            id: savedUser.id,
          },
        },
      },
    });
    const payload = { email: user.email };
    const token = jwt.sign(payload);

    return {
      info: { ...savedUser, _id: savedUser.id, createdAt, email: savedCredentials.email },
      token,
    };
  }

  async signin(
    user: SignInDto,
    jwt: JwtService
  ): Promise<{
    token: string;
    name: string;
    role: string;
  }> {
    const foundCredentials = await this.prismaService.credentials.findUnique({
      where: { email: user.email },
    });
    if (!foundCredentials) {
      throw new HttpException('Email chưa được đăng ký', HttpStatus.UNAUTHORIZED);
    }
    const comparison = await bcrypt.compare(user.password, foundCredentials.password);
    if (!comparison) {
      throw new HttpException('Sai mật khẩu', HttpStatus.UNAUTHORIZED);
    }
    const foundUser = await this.prismaService.user.findUnique({
      where: { id: foundCredentials.uid },
    });
    const payload = { email: user.email };
    return {
      token: jwt.sign(payload),
      name: foundUser.firstName + foundUser.lastName,
      role: foundUser.role,
    };
  }

  async updatePassword(user: User, updatePasswordDto: UpdatePasswordDto): Promise<void> {
    const currentCredential = await this.prismaService.credentials.findUnique({
      where: { uid: user._id },
    });
    if (!currentCredential) {
      throw new Error('Người dùng không tồn tại');
    }

    const comparison = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      currentCredential.password
    );
    if (!comparison) {
      throw new Error('Mật khẩu hiện tại không đúng');
    }

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(updatePasswordDto.newPassword, salt);
    await this.prismaService.credentials.update({
      where: { uid: user._id },
      data: { password: hash },
    });
  }

  async getByEmail(email: string): Promise<any> {
    return this.prismaService.credentials.findUnique({ where: { email } });
  }
  async getById(id: string): Promise<any> {
    return this.prismaService.user.findUnique({ where: { id } });
  }
  async getAll(): Promise<any> {
    return this.prismaService.user.findMany();
  }
}
