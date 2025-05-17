import { OmitType, PickType } from '@nestjs/swagger';

import { OrderEntity } from '../entity/order.entity';
import { GetOrderResponseDto } from './response.dto';

export class CreateOrderDto extends OmitType(OrderEntity, ['id']) {}

export class CreateStudentOrderDto extends PickType(CreateOrderDto, [
  'checkCode',
  'brand',
  'product',
  'deliveryDate',
  'weight',
  'room',
  'building',
  'dormitory',
  'paymentMethod',
]) {}

export class CreateAdminOrderDto extends PickType(CreateOrderDto, ['checkCode', 'brand']) {}

export class CreateOrderResponseDto {
  readonly message: string;
  readonly data: GetOrderResponseDto;
}
