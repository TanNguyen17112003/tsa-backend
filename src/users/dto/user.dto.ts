import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SignUpDto } from 'src/auth/dto';

export class UpdateStudentDto extends PartialType(OmitType(SignUpDto, ['token', 'password'])) {
  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'URL to the avatar of user',
  })
  readonly photoUrl?: string;

  @IsOptional()
  @ApiProperty({ type: 'string', format: 'binary' })
  readonly avatar?: any;
}

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'ABC', description: 'Current password of user' })
  readonly currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'ABC', description: 'New password of user' })
  readonly newPassword: string;
}

export class UpdateRoleDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'ADMIN', description: 'New role of user' })
  readonly role: string;
}

export class UpdateStatusDto {
  @IsString()
  @IsIn(Object.values(UserStatus))
  @ApiProperty({ example: UserStatus.DEACTIVATED, description: 'New status of user' })
  readonly status: UserStatus;
}
