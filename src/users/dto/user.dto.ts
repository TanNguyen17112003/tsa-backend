import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SignUpDto } from 'src/auth/dto';

export class UpdateStudentDto extends PartialType(OmitType(SignUpDto, ['token', 'password'])) {
  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'URL to the avatar of user',
  })
  readonly photoUrl?: string;
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
