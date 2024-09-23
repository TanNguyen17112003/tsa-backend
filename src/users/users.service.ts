import { Injectable } from '@nestjs/common';
// import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma';

import { UserEntity } from './entities';

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

  async findById(id: string): Promise<UserEntity> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });
    const credentials = await this.prismaService.credentials.findUnique({
      where: { uid: id },
    });
    return {
      ...user,
      email: credentials?.email || null,
    };
  }

  async findAll(): Promise<UserEntity[]> {
    return this.prismaService.user.findMany();
  }

  // async updatePassword(user: User, updatePasswordDto: UpdatePasswordDto): Promise<void> {
  //   const currentCredential = await this.prismaService.credentials.findUnique({
  //     where: { uid: user.id },
  //   });
  //   if (!currentCredential) {
  //     throw new Error('Người dùng không tồn tại');
  //   }

  //   const comparison = await bcrypt.compare(
  //     updatePasswordDto.currentPassword,
  //     currentCredential.password
  //   );
  //   if (!comparison) {
  //     throw new Error('Mật khẩu hiện tại không đúng');
  //   }

  //   const salt = await bcrypt.genSalt();
  //   const hash = await bcrypt.hash(updatePasswordDto.newPassword, salt);
  //   await this.prismaService.credentials.update({
  //     where: { uid: user.id },
  //     data: { password: hash },
  //   });
  // }
}
