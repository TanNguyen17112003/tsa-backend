import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class UserEntity implements Omit<User, 'password'> {
  @ApiProperty({ example: '123456789', description: 'Id of user' })
  @IsString()
  readonly id: string;

  @IsEmail()
  @ApiProperty({ example: 'user@example.com', description: 'Email of user' })
  readonly email: string;

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
  @ApiProperty({ example: 'avatar.jpg', description: 'Avatar of user' })
  readonly photoUrl: string | null;

  @IsIn(Object.values(UserRole))
  @ApiProperty({ example: 'STUDENT', description: 'Role of user' })
  readonly role: UserRole;

  @ApiProperty({ example: true, description: 'Whether the user is verified' })
  @IsBoolean()
  readonly verified: boolean;

  @IsString()
  @ApiProperty({
    example: '1726015631',
    description: 'Unix timestamp of when the user was created',
  })
  readonly createdAt: Date;
}
