import { OmitType } from '@nestjs/swagger';

import { OrderEntity } from '../entity/order.entity';

export class CreateOrder extends OmitType(OrderEntity, ['id']) {}
