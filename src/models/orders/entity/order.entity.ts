import { $Enums, Order } from '@prisma/client';
import { IsOptional } from 'class-validator';
import { RestrictProperties } from 'src/types';

export class OrderEntity implements RestrictProperties<OrderEntity, Order> {
  id: string;
  status: $Enums.OrderStatus;
  @IsOptional()
  studentId: string;
  @IsOptional()
  adminId: string;
  createdAt: string;
  @IsOptional()
  deliveredAt: string;
  @IsOptional()
  cancelledAt: string;
  @IsOptional()
  rejectedAt: string;
  @IsOptional()
  acceptedAt: string;
  shippingFee: number;
  address: string;
  @IsOptional()
  deliveryId: string;
  @IsOptional()
  ordinalNumber: number;
  checkCode: string;
  @IsOptional()
  weight: number;
  @IsOptional()
  rejectReason: string;
  @IsOptional()
  cancelReason: string;
  @IsOptional()
  shipperId: string;
  @IsOptional()
  isPaid: boolean;
  @IsOptional()
  paymentMethod: $Enums.PaymentMethod;
}
