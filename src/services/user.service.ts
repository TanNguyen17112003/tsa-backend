import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma';
// import { SignInDto, UpdatePasswordDto } from 'src/users/dto/user.dto';
// import { UserEntity } from 'src/users/entities/user.entity';

interface UserResponse {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  createdAt: string;
  verified?: boolean;
}

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  async signin(
    user,
    jwt: JwtService
  ): Promise<{
    token: string;
    userInfo: UserResponse;
  }> {
    const foundCredentials = await this.prismaService.credentials.findUnique({
      where: { email: user.email },
    });
    if (!foundCredentials) {
      throw new HttpException('Email chưa được đăng ký', HttpStatus.UNAUTHORIZED);
    }

    // Xài tk của user seed thì comment nhé

    // const comparison = await bcrypt.compare(user.password, foundCredentials.password);
    // if (!comparison) {
    //   throw new HttpException('Sai mật khẩu', HttpStatus.UNAUTHORIZED);
    // }
    const foundUser = await this.prismaService.user.findUnique({
      where: { id: foundCredentials.uid },
    });
    const payload = { email: user.email, role: foundUser.role, id: foundUser.id };
    return {
      token: jwt.sign(payload),
      userInfo: {
        id: foundUser.id,
        email: user.email,
        role: foundUser.role,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        createdAt: foundUser.createdAt,
        phoneNumber: foundUser.phoneNumber,
        verified: foundUser.verified!,
      },
    };
  }

  async updatePassword(user, updatePasswordDto): Promise<void> {
    const currentCredential = await this.prismaService.credentials.findUnique({
      where: { uid: user.id },
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
      where: { uid: user.id },
      data: { password: hash },
    });
  }

  async getByEmail(email: string): Promise<any> {
    return this.prismaService.credentials.findUnique({ where: { email } });
  }

  async getById(id: string): Promise<UserResponse> {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const credentials = await this.prismaService.credentials.findUnique({ where: { uid: id } });
    return {
      id: user.id,
      email: credentials.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
      verified: user.verified,
    };
  }

  async getAll(): Promise<any> {
    return this.prismaService.user.findMany();
  }
}
