import { ApiProperty } from '@nestjs/swagger';
import { NotificatioType } from '@prisma/client';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class NotificationDto {
  @IsString()
  @ApiProperty({ example: '111', description: 'Notification id' })
  readonly id: string;

  @IsString()
  @IsIn(Object.values(NotificatioType))
  @ApiProperty({ example: NotificatioType.ORDER, description: 'Type of notification' })
  readonly type: NotificatioType;

  @IsString()
  @ApiProperty({ example: 'Đơn hàng đã được chấp nhận', description: 'Title of notification' })
  readonly title: string;

  @IsString()
  @ApiProperty({
    example: 'Đơn hàng của bạn đã được chấp nhận',
    description: 'Content of notification',
  })
  readonly content: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: '111', description: 'Order id' })
  readonly orderId: string | null;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: '111', description: 'Delivery id' })
  readonly deliveryId: string | null;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: '111', description: 'Report id' })
  readonly reportId: string | null;

  @IsString()
  @ApiProperty({ example: '111', description: 'User id' })
  readonly userId: string | null;

  @IsBoolean()
  @ApiProperty({ example: false, description: 'Is read' })
  readonly isRead: boolean;
}

export class GetNotificationsDto {
  @ApiProperty({ type: [NotificationDto] })
  readonly notifications: NotificationDto[];

  @ApiProperty({ example: 10, description: 'Total number of notifications' })
  readonly unreadCount: number;
}
