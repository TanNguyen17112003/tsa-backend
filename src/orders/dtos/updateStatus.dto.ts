import { $Enums } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @IsEnum($Enums.OrderStatus)
  status: $Enums.OrderStatus;
}
