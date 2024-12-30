import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

import { DeliveryEntity } from '../entities/delivery.entity';

export class CreateDeliveryDto extends OmitType(DeliveryEntity, [
  'id',
  'createdAt',
  'latestStatus',
  'numberOrder',
]) {
  @ApiProperty({ example: ['123456789', '123456788'], description: 'Order IDs' })
  @IsArray()
  orderIds: string[];
}
