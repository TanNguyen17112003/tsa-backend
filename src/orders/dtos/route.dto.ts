import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

import { OrderEntity } from '../entity';

export class RouteOrderDto extends PickType(OrderEntity, ['id', 'room', 'building', 'dormitory']) {}

export class RouteOrdersDto {
  @ApiProperty({
    example: [
      {
        id: 'a',
        room: '102',
        building: 'A12',
        dormitory: 'A',
      },
      {
        id: 'b',
        room: '102',
        building: 'A7',
        dormitory: 'A',
      },
    ],
    description: 'Orders',
  })
  @IsArray()
  orders: RouteOrderDto[];
}
