import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, OrderStatusHistory } from '@prisma/client';

import { OrderEntity } from '../entity';

export class GetOrderResponseDto extends OrderEntity {
  @ApiProperty()
  latestStatus: OrderStatus | null;

  @ApiProperty()
  historyTime: OrderStatusHistory[] | null;

  @ApiProperty()
  staffInfo?: {
    lastName: string;
    firstName: string;
    phoneNumber: string;
    photoUrl: string;
  };
}
