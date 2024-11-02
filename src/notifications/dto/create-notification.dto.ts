import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @ApiProperty({ example: 'ORDER', description: 'Type of notification' })
  readonly type: $Enums.NotificatioType;

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
  readonly orderId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: '111', description: 'Delivery id' })
  readonly deliveryId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: '111', description: 'Report id' })
  readonly reportId: string;

  @IsString()
  @ApiProperty({ example: '111', description: 'User id' })
  readonly userId: string;
}
