import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma';

import { UpdatePasswordDto, UpdateStudentDto } from './dto';
import { StudentEntity, UserEntity } from './entities';

@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    const credential = await this.prismaService.credentials.findUnique({ where: { email } });
    if (!credential) {
      return null;
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: credential.uid },
    });
    return {
      ...user,
      email: credential.email,
    };
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });
    if (!user) {
      return null;
    }
    const credentials = await this.prismaService.credentials.findUnique({
      where: { uid: id },
    });
    return {
      ...user,
      email: credentials?.email || null,
    };
  }

  async findStudentById(id: string): Promise<StudentEntity | null> {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }
    const student = await this.prismaService.student.findUnique({
      where: { studentId: id },
    });
    return {
      ...user,
      ...student,
    };
  }

  async findAll(): Promise<UserEntity[]> {
    return this.prismaService.user.findMany();
  }

  async updateStudentById(id: string, data: UpdateStudentDto): Promise<StudentEntity> {
    const user = await this.prismaService.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
      },
    });
    const student = await this.prismaService.student.update({
      where: { studentId: id },
      data: {
        dormitory: data.dormitory,
        building: data.building,
        room: data.room,
      },
    });
    return {
      ...user,
      ...student,
    };
  }

  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto): Promise<void> {
    const currentCredential = await this.prismaService.credentials.findUnique({
      where: { uid: userId },
    });
    if (!currentCredential) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    const comparison = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      currentCredential.password
    );
    if (!comparison) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    const hash = await bcrypt.hash(updatePasswordDto.newPassword, Number(process.env.SALT_ROUNDS));
    await this.prismaService.credentials.update({
      where: { uid: userId },
      data: { password: hash },
    });
  }
}
