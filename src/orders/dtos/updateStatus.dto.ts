import { OrderStatus } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum OrderCancelType {
  FROM_STUDENT = 'FROM_STUDENT',
  FROM_STAFF = 'FROM_STAFF',
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

  @IsEnum(OrderCancelType)
  @IsOptional()
  cancelReasonType?: OrderCancelType;

  @IsString()
  @IsOptional()
  receivedImage?: string;
}
