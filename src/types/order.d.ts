export interface OrderType {
  id: string;
  customerId: string;
  shipperId?: string;
  staffId?: string;
  status: OrderStatus;
  createdAt: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  rejectedAt?: Date;
  acceptedAt?: Date;
  shippingFee: number;
  address: string;
}

enum OrderStatus {
  PENDING,
  DELIVERED,
  CANCELLED,
  IN_TRANSIT
}
