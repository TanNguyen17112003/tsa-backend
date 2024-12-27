import { OrderStatus } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum OrderCancelReason {
  'WRONG_ADDRESS' = 'WRONG_ADDRESS',
  'CAN_NOT_CONTACT' = 'CAN_NOT_CONTACT',
  'PAYMENT_ISSUE' = 'PAYMENT_ISSUE',
  'DAMAGED_PRODUCT' = 'DAMAGED_PRODUCT',
  'HEAVY_PRODUCT' = 'HEAVY_PRODUCT',
  'PERSONAL_REASON' = 'PERSONAL_REASON',
  'DAMEGED_VEHICLE' = 'DAMEGED_VEHICLE',
  'OTHER' = 'OTHER',
}

export class UpdateStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsString()
  @IsOptional()
  finishedImage?: string;

  @IsString()
  @IsOptional()
  canceledImage?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsNumber()
  @IsOptional()
  distance?: number;

  @IsEnum(OrderCancelReason)
  @IsOptional()
  cancelReasonType?: OrderCancelReason;
}
