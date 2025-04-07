import { ApiProperty } from '@nestjs/swagger';
import { OrderEntity } from 'src/orders/entity';

export class GroupOrdersResponseDto {
  @ApiProperty({ type: [OrderEntity] })
  deliveries: OrderEntity[];

  @ApiProperty({ type: [OrderEntity] })
  delayed: OrderEntity[];
}
