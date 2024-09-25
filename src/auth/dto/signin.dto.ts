import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { UserEntity } from 'src/users/entities';

export class SignInDto {
  @IsEmail()
  @ApiProperty({ example: 'user@example.com', description: 'Email of user' })
  readonly email: string;

  @IsString()
  @ApiProperty({ example: 'nguyenaa', description: 'Password of user' })
  readonly password: string;
}

export class SignInResultDto {
  @IsString()
  @ApiProperty({ example: 'valid-token', description: 'JWT Token' })
  readonly token: string;

  readonly userInfo: UserEntity;
}
