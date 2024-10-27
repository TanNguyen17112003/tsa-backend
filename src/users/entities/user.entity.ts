import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class UserEntity implements User {
  @ApiProperty({ example: '123456789', description: 'Id of user', required: true })
  @IsString()
  id: string;

  @IsString()
  @ApiProperty({ example: 'John', description: 'First name of user (Tên)' })
  firstName: string;

  @IsString()
  @ApiProperty({ example: 'Doe', description: 'Last name of user (Họ)' })
  lastName: string;

  @IsString()
  @ApiProperty({
    example: '1726015631',
    description: 'Unix timestamp of when the user was created',
    required: true,
  })
  createdAt: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: '123456', description: 'Phone number of user', required: true })
  phoneNumber: string | null;

  @IsIn(Object.values(UserRole))
  @ApiProperty({ example: 'STUDENT', description: 'Role of user', required: true })
  role: UserRole;

  @ApiProperty({ example: 'true', description: 'Whether the user is verified', required: true })
  @IsBoolean()
  verified: boolean;

  // Added this field so cannot use RestrictProperties
  @IsEmail()
  @IsOptional()
  @ApiPropertyOptional({ example: 'user@example.com', description: 'Email of user' })
  email?: string | null;

  @IsString()
  @ApiProperty({ example: 'avatar.jpg', description: 'Avatar of user', required: true })
  photoUrl: string | null;
}
