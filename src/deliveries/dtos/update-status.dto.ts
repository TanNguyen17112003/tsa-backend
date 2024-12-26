import { DeliveryStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;
}
