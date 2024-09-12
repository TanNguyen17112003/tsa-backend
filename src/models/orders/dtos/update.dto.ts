import { PartialType } from '@nestjs/swagger';
import { Order } from '@prisma/client';

import { CreateOrder } from './create.dto';

export class UpdateOrder extends PartialType(CreateOrder) {
  id: Order['id'];
}
