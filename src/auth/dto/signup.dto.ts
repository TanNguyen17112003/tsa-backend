import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Dormitory } from '@prisma/client';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class SignUpInitDto {
  @IsString()
  @ApiProperty({ example: 'user@example.com', description: 'Email of user' })
  readonly email: string;
}

export class SignUpDto {
  @IsString()
  @ApiProperty({ example: 'John', description: 'First name of user (Tên)' })
  readonly firstName: string;

  @IsString()
  @ApiProperty({ example: 'Doe', description: 'Last name of user (Họ)' })
  readonly lastName: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: '123456', description: 'Phone number of user' })
  readonly phoneNumber: string | null;

  @IsString()
  @ApiProperty({ example: 'nguyenaa', description: 'Password of user' })
  readonly password: string;

  @IsIn(Object.values(Dormitory))
  @ApiProperty({ example: 'A', description: 'Dormitory of student' })
  readonly dormitory: Dormitory;

  @IsString()
  @ApiProperty({ example: 'A', description: 'Building of student' })
  readonly building: string;

  @IsString()
  @ApiProperty({ example: 'A101', description: 'Room of student' })
  readonly room: string;

  @IsString()
  @ApiProperty({ example: 'valid-token', description: 'JWT Token to validate registration' })
  readonly token: string;
}
