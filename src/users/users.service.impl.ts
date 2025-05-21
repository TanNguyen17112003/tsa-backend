import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CloudinaryService } from 'src/cloudinary';
import { PrismaService } from 'src/prisma';

import { UpdatePasswordDto, UpdateStudentDto } from './dto';
import { StudentEntity, UserEntity } from './entities';
import { UsersService } from './users.service';

@Injectable()
export class UsersServiceImpl extends UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly cloudinaryService: CloudinaryService
  ) {
    super();
  }

  override async getUsers(): Promise<UserEntity[]> {
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
          dormitory: user.student.dormitory,
          building: user.student.building,
          room: user.student.room,
        };
      } else {
        return user;
      }
    });
  }

  override async updateUserRole(id: string, newRole: UserRole): Promise<UserEntity> {
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
        },
      });
    } else if (newRole === UserRole.STAFF) {
      await this.prismaService.staff.create({
        data: {
          user: { connect: { id } },
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

  override async updateUserStatus(userId: string, status: UserStatus): Promise<UserEntity> {
    const userToUpdate = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
      },
    });

    if (!userToUpdate) {
      throw new NotFoundException('User not found');
    }

    const isUnBanned =
      userToUpdate.role === UserRole.STUDENT &&
      userToUpdate.status === UserStatus.BANNED &&
      status === UserStatus.AVAILABLE;

    const data: Prisma.UserUpdateInput = {
      status,
    };

    // TH ban student
    if (status === UserStatus.BANNED && userToUpdate.role === UserRole.STUDENT) {
      const regulation = await this.prismaService.dormitoryRegulation.findFirst({
        where: {
          name: userToUpdate.student?.dormitory,
        },
      });

      const bannedThreshold = regulation?.banThreshold || Number(process.env.BANNED_STUDENT_NUMBER);
      data.student = {
        update: {
          numberFault: bannedThreshold,
        },
      };
      // TH unban student
    } else if (isUnBanned) {
      const regulation = await this.prismaService.dormitoryRegulation.findFirst({
        where: {
          name: userToUpdate.student?.dormitory,
        },
      });
      const oldNumberFault = regulation?.banThreshold || userToUpdate.student?.numberFault || 0;
      data.student = {
        update: {
          numberFault: Math.max(oldNumberFault - 1, 0),
        },
      };
    }

    // Các TH còn lại không liên quan đến student
    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data,
    });

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

  override async findById(id: string): Promise<UserEntity> {
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

  override async updateStudentById(
    id: string,
    data: UpdateStudentDto,
    avatar?: Express.Multer.File
  ): Promise<StudentEntity> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    let photoUrl = data.photoUrl;
    if (avatar) {
      const { secure_url } = await this.cloudinaryService.uploadImage(avatar.buffer);
      photoUrl = secure_url;
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        photoUrl: photoUrl,
      },
    });
    let student;
    if (updatedUser.role === 'STUDENT') {
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
      ...updatedUser,
      ...student,
    };
  }

  override async updatePassword(
    userId: string,
    updatePasswordDto: UpdatePasswordDto
  ): Promise<void> {
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

  override async deleteUser(id: string): Promise<{ message: string }> {
    await this.prismaService.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }
}
