import { $Enums, Order } from '@prisma/client';
import { IsOptional } from 'class-validator';
import { RestrictProperties } from 'src/types';

export class OrderEntity implements RestrictProperties<OrderEntity, Order> {
  id: string;
  @IsOptional()
  studentId: string;
  @IsOptional()
  adminId: string;
  shippingFee: number;
  deliveryDate: string;
  @IsOptional()
  dormitory: $Enums.Dormitory;
  @IsOptional()
  building: string;
  @IsOptional()
  room: string;
  @IsOptional()
  deliveryId: string;
  @IsOptional()
  ordinalNumber: number;
  @IsOptional()
  phone: string;
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
  @IsOptional()
  latestStatusId: string;
}
