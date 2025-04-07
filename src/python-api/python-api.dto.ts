import { ApiProperty } from '@nestjs/swagger';
import { RouteOrdersDto } from 'src/orders/dtos/route.dto';
import { OrderEntity } from 'src/orders/entity';

export class GroupOrdersResponseDto {
  @ApiProperty({ type: [OrderEntity] })
  deliveries: OrderEntity[];

  @ApiProperty({ type: [OrderEntity] })
  delayed: OrderEntity[];
}

export class RouteOrdersResponseDto extends RouteOrdersDto {}
