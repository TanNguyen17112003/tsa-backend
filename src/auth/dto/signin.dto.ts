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
  @ApiProperty({ example: 'valid-token', description: 'JWT Access Token' })
  readonly accessToken: string;

  @IsString()
  @ApiProperty({ example: 'valid-refresh-token', description: 'Refresh Token' })
  readonly refreshToken: string;

  @ApiProperty({ type: UserEntity })
  readonly userInfo: UserEntity;
}

export class RefreshTokenDto {
  @IsString()
  @ApiProperty({ example: 'valid-refresh-token', description: 'Refresh Token' })
  readonly refreshToken: string;
}

export class RefreshTokenResultDto {
  @IsString()
  @ApiProperty({ example: 'valid-token', description: 'JWT Access Token' })
  readonly accessToken: string;

  @IsString()
  @ApiProperty({ example: 'valid-refresh-token', description: 'Refresh Token' })
  readonly refreshToken: string;
}
