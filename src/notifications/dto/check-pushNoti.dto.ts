import { ApiProperty } from '@nestjs/swagger';
import { PushNotiType } from '@prisma/client';
import { IsString } from 'class-validator';

export class CheckPushNotificationDto {
  @IsString()
  @ApiProperty({ example: '111', description: 'User id' })
  readonly userId: string;

  @IsString()
  @ApiProperty({ example: '111', description: 'Token' })
  readonly token: string;
}

export class CheckPushNotificationResponseDto {
  @ApiProperty({ example: PushNotiType.ENABLED, description: 'Push notification type' })
  readonly pusNotiType: PushNotiType | null;
}
