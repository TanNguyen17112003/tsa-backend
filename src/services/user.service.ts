import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
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

    const existingUser = await this.prismaService.user.findUnique({ where: { email: user.email } });
    if (existingUser) {
      throw new HttpException('Email is already in use', HttpStatus.BAD_REQUEST);
    }

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(user.password, salt);
    const reqBody = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: hash,
    };
    const savedUser = await this.prismaService.user.create({
      data: reqBody,
    });

    const payload = { email: user.email };
    const token = jwt.sign(payload);

    return { info: { ...savedUser, _id: savedUser.id, createdAt: new Date() }, token };
  }

  async signin(user: SignInDto, jwt: JwtService): Promise<any> {
    const foundUser = await this.prismaService.user.findUnique({ where: { email: user.email } });
    if (!foundUser) {
      throw new HttpException('Incorrect username or password', HttpStatus.UNAUTHORIZED);
    }

    const comparison = await bcrypt.compare(user.password, foundUser.password);
    if (!comparison) {
      throw new HttpException('Incorrect username or password', HttpStatus.UNAUTHORIZED);
    }

    const payload = { email: user.email };
    return { token: jwt.sign(payload), name: foundUser.firstName + foundUser.lastName };
  }

  async updatePassword(user: User, updatePasswordDto: UpdatePasswordDto): Promise<void> {
    const currentUser = await this.prismaService.user.findUnique({ where: { id: user._id } });
    if (!currentUser) {
      throw new Error('User or request not found');
    }

    const comparison = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      currentUser.password
    );
    if (!comparison) {
      throw new Error('Incorrect current password');
    }

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(updatePasswordDto.newPassword, salt);
    currentUser.password = hash;
  }

  async getByEmail(email: string): Promise<any> {
    return this.prismaService.user.findUnique({ where: { email } });
  }
  async getById(id: string): Promise<any> {
    return this.prismaService.user.findUnique({ where: { id } });
  }
  async getAll(): Promise<any> {
    return this.prismaService.user.findMany();
  }
}
