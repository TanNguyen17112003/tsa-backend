import { UserRole, UserStatus } from '@prisma/client';
import { MessageResponseDto } from 'src/common/dtos/message-response.dto';

import { UpdatePasswordDto, UpdateStudentDto } from './dto';
import { StudentEntity, UserEntity } from './entities';

export abstract class UsersService {
  abstract getUsers(): Promise<UserEntity[]>;

  abstract updateUserRole(id: string, newRole: UserRole): Promise<UserEntity>;

  abstract updateUserStatus(userId: string, status: UserStatus): Promise<UserEntity>;

  abstract findById(id: string): Promise<UserEntity>;

  abstract updateStudentById(
    id: string,
    data: UpdateStudentDto,
    avatar?: Express.Multer.File
  ): Promise<StudentEntity>;

  abstract updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto): Promise<void>;

  abstract deleteUser(id: string): Promise<MessageResponseDto>;
}
