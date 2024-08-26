import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @IsEmail()
  @ApiProperty({ example: 'nguyena@gmail.com', description: 'Email of user v2' })
  readonly email: string;

  @IsString()
  @ApiProperty({ example: 'nguyenaa', description: 'Password of user v2' })
  readonly password: string;
}

export class SignUpDto extends SignInDto {
  @IsString()
  @ApiProperty({ example: 'Nguyen', description: 'First name of user' })
  readonly firstName: string;
  @IsString()
  @ApiProperty({ example: 'A', description: 'Last name of user' })
  readonly lastName: string;
}

export class UpdateNameDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Nguyen A', description: 'Name of user' })
  readonly name: string;
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
