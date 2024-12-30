import { $Enums, OrderStatusHistory } from '@prisma/client';
import { IsOptional } from 'class-validator';
import { RestrictProperties } from 'src/types';

export class OrderStatusHistoryEntity
  implements RestrictProperties<OrderStatusHistoryEntity, OrderStatusHistory>
{
  id: string;
  orderId: string;
  status: $Enums.OrderStatus;
  @IsOptional()
  reason: string;
  time: string;
  @IsOptional()
  canceledImage: string;
}
