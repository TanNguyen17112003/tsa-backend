import { OmitType, PickType } from '@nestjs/swagger';

import { OrderEntity } from '../entity/order.entity';

export class CreateOrderDto extends OmitType(OrderEntity, ['id']) {}

export class CreateStudentOrderDto extends PickType(CreateOrderDto, [
  'checkCode',
  'product',
  'deliveryDate',
  'weight',
  'room',
  'building',
  'dormitory',
  'paymentMethod',
]) {}

export class CreateAdminOrderDto extends PickType(CreateOrderDto, [
  'checkCode',
  'product',
  'weight',
  'phone',
]) {}
