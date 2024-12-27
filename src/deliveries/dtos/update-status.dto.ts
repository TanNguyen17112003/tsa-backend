import { DeliveryStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum DeliveryCancelReason {
  'DAMEGED_VEHICLE' = 'DAMEGED_VEHICLE',
  'PERSONAL_REASON' = 'PERSONAL_REASON',
  'OTHER' = 'OTHER',
}
export class UpdateStatusDto {
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  canceledImage?: string;

  @IsEnum(DeliveryCancelReason)
  @IsOptional()
  cancelReasonType?: DeliveryCancelReason;
}
