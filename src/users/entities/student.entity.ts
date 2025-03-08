import { ApiProperty } from '@nestjs/swagger';
import { Dormitory, Student, UserStatus } from '@prisma/client';
import { IsIn, IsString } from 'class-validator';

import { UserEntity } from './user.entity';

export class StudentEntity extends UserEntity implements Student {
  @IsString()
  @ApiProperty({ example: '123456789', description: 'Id of student' })
  studentId: string;

  @IsIn(Object.values(UserStatus))
  @ApiProperty({ example: UserStatus.AVAILABLE, description: 'Status of student' })
  status: UserStatus;

  @IsIn(Object.values(Dormitory))
  @ApiProperty({ example: Dormitory.A, description: 'Dormitory of student' })
  dormitory: Dormitory;

  @IsString()
  @ApiProperty({ example: 'H1', description: 'Building of student' })
  building: string;

  @IsString()
  @ApiProperty({ example: 'A101', description: 'Room of student' })
  room: string;
}
