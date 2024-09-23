import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

// export class UpdateUserDto extends PartialType(SignUpDto) {
// @IsString()
// @IsNotEmpty()
// @ApiProperty({ example: 'Nguyen A', description: 'Name of user' })
// readonly name: string;
// }

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
