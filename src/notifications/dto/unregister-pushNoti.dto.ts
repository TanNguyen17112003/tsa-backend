import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '@prisma/client';
import { IsString } from 'class-validator';

export class UnregisterPushNotificationDto {
  @IsString()
  @ApiProperty({ example: '111', description: 'User id' })
  readonly userId: string;

  @IsString()
  @ApiProperty({ example: '111', description: 'Token' })
  readonly token: string;

  @IsString()
  @ApiProperty({ example: 'LOGOUT', description: 'Type of unregister' })
  readonly type: $Enums.PushNotiType;
}
