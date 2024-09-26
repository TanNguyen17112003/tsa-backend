import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { SignUpDto } from 'src/auth/dto';

export class UpdateStudentDto extends PartialType(OmitType(SignUpDto, ['token', 'password'])) {}

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
