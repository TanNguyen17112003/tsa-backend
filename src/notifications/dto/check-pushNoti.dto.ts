import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CheckPushNotificationDto {
  @IsString()
  @ApiProperty({ example: '111', description: 'User id' })
  readonly userId: string;

  @IsString()
  @ApiProperty({ example: '111', description: 'Token' })
  readonly token: string;
}
