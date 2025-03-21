import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma';

import { UpdatePasswordDto, UpdateStudentDto } from './dto';
import { StudentEntity, UserEntity } from './entities';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async getUsers(): Promise<UserEntity[]> {
    const users = await this.prismaService.user.findMany({
      include: {
        student: true,
        staff: true,
      },
    });

    return users.map((user) => {
      if (user.role === 'STUDENT' && user.student) {
        return {
          ...user,
          status: user.student.status,
          dormitory: user.student.dormitory,
          building: user.student.building,
          room: user.student.room,
        };
      } else if (user.role === 'STAFF' && user.staff) {
        return {
          ...user,
          status: user.staff.status,
        };
      } else {
        return user;
      }
    });
  }

  async updateUserRole(id: string, newRole: UserRole): Promise<UserEntity> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      include: {
        student: true,
        staff: true,
        admin: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not exist!');
    }

    if (user.role === UserRole.STUDENT && user.student) {
      await this.prismaService.student.delete({
        where: { studentId: id },
      });
    } else if (user.role === UserRole.STAFF && user.staff) {
      await this.prismaService.staff.delete({
        where: { staffId: id },
      });
    } else if (user.role === UserRole.ADMIN && user.admin) {
      await this.prismaService.admin.delete({
        where: { adminId: id },
      });
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id },
      data: { role: newRole },
    });

    if (newRole === UserRole.STUDENT) {
      await this.prismaService.student.create({
        data: {
          user: { connect: { id } },
          status: UserStatus.OFFLINE,
        },
      });
    } else if (newRole === UserRole.STAFF) {
      await this.prismaService.staff.create({
        data: {
          user: { connect: { id } },
          status: UserStatus.OFFLINE,
        },
      });
    } else if (newRole === UserRole.ADMIN) {
      await this.prismaService.admin.create({
        data: {
          user: { connect: { id } },
        },
      });
    }

    return updatedUser;
  }

  // async findByEmail(email: string): Promise<UserEntity | null> {
  //   const credential = await this.prismaService.credentials.findUnique({ where: { email } });
  //   if (!credential) {
  //     return null;
  //   }

  //   const user = await this.prismaService.user.findUnique({
  //     where: { id: credential.uid },
  //   });
  //   return {
  //     ...user,
  //     email: credential.email,
  //   };
  // }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userInfo } = user;
    let studentAdditionalInfo = null;
    if (user.role === UserRole.STUDENT) {
      const student = await this.prismaService.student.findUnique({
        where: { studentId: id },
      });
      studentAdditionalInfo = {
        dormitory: student.dormitory,
        building: student.building,
        room: student.room,
      };
    }
    return {
      ...userInfo,
      ...studentAdditionalInfo,
    };
  }

  async updateStudentById(id: string, data: UpdateStudentDto): Promise<StudentEntity> {
    const user = await this.prismaService.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        photoUrl: data.photoUrl,
      },
    });
    let student;
    if (user.role === 'STUDENT') {
      student = await this.prismaService.student.update({
        where: { studentId: id },
        data: {
          dormitory: data.dormitory,
          building: data.building,
          room: data.room,
        },
      });
    }
    return {
      ...user,
      ...student,
    };
  }

  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto): Promise<void> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    const comparison = await bcrypt.compare(updatePasswordDto.currentPassword, user.password);
    if (!comparison) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    const hash = await bcrypt.hash(
      updatePasswordDto.newPassword,
      Number(this.configService.get('SALT_ROUNDS'))
    );
    await this.prismaService.user.update({
      where: { id: userId },
      data: { password: hash },
    });
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    await this.prismaService.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }
}
