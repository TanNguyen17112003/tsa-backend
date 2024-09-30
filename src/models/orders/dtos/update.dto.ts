import { PartialType } from '@nestjs/swagger';
import { Order } from '@prisma/client';

import { CreateOrderDto } from './create.dto';

export class UpdateOrder extends PartialType(CreateOrderDto) {
  id: Order['id'];
}
