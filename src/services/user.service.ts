import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DateService } from 'src/common/date/date.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { SignInDto, SignUpDto, UpdatePasswordDto } from 'src/dto/user.dto';
import { User } from 'src/models/user.model';

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
  constructor(
    private prismaService: PrismaService,
    private dateService: DateService
  ) {}

  async signup(user: SignUpDto, jwt: JwtService): Promise<{ info: User; token: string }> {
    if (!user.firstName || !user.lastName || !user.email || !user.password) {
      throw new HttpException('Name, email, and password are required', HttpStatus.BAD_REQUEST);
    }

    const existingUser = await this.prismaService.credentials.findUnique({
      where: { email: user.email },
    });
    if (existingUser) {
      throw new HttpException('Email đã được sử dụng để đăng ký', HttpStatus.BAD_REQUEST);
    }

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(user.password, salt);
    const createdAt = this.dateService.getCurrentUnixTimestamp().toString();
    const savedUser = await this.prismaService.user.create({
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        createdAt,
      },
    });
    const [savedCredentials] = await Promise.all([
      this.prismaService.credentials.create({
        data: {
          email: user.email,
          password: hash,
          uid: savedUser.id,
        },
      }),
      await this.prismaService.student.create({
        data: {
          studentId: savedUser.id,
        },
      }),
    ]);

    const payload = { email: user.email, role: savedUser.role, id: savedUser.id };
    const token = jwt.sign(payload);

    return {
      info: { ...savedUser, email: savedCredentials.email },
      token,
    };
  }

  async signin(
    user: SignInDto,
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

  async updatePassword(user: User, updatePasswordDto: UpdatePasswordDto): Promise<void> {
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
