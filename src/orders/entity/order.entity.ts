import { $Enums, Order } from '@prisma/client';
import { IsOptional } from 'class-validator';
import { RestrictProperties } from 'src/types';

export class OrderEntity implements RestrictProperties<OrderEntity, Order> {
  id: string;
  @IsOptional()
  studentId: string;
  shippingFee: number;
  @IsOptional()
  deliveryDate: string;
  @IsOptional()
  dormitory: $Enums.Dormitory;
  @IsOptional()
  building: string;
  @IsOptional()
  room: string;
  @IsOptional()
  phone: string;
  @IsOptional()
  checkCode: string;
  @IsOptional()
  weight: number;
  @IsOptional()
  shipperId: string;
  @IsOptional()
  isPaid: boolean;
  @IsOptional()
  paymentMethod: $Enums.PaymentMethod;
  @IsOptional()
  product: string;
}
