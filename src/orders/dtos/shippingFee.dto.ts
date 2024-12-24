import { PickType } from '@nestjs/swagger';

import { CreateOrderDto } from './create.dto';

export class ShippingFeeDto extends PickType(CreateOrderDto, [
  'weight',
  'room',
  'building',
  'dormitory',
] as const) {}
