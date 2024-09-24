import { ApiProperty } from '@nestjs/swagger';
import { Dormitory } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsIn, IsString, ValidateNested } from 'class-validator';

export class SignUpDtoInit {
  @IsString()
  @ApiProperty({ example: 'abc@example.com', description: 'Email of user' })
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
  @ApiProperty({ example: '123456', description: 'Phone number of user' })
  readonly phoneNumber: string;

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
}

export class CompleteRegistrationDto {
  @IsString()
  @ApiProperty({ example: 'some-token-value', description: 'Registration token' })
  token: string;

  @ValidateNested()
  @Type(() => SignUpDto)
  @ApiProperty({
    type: SignUpDto,
    example: {
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '123456',
      password: 'nguyenaa',
      dormitory: 'A',
      building: 'A',
      room: 'A101',
    },
  })
  userData: SignUpDto;
}
