import { ApiProperty } from '@nestjs/swagger';
import { OrderEntity } from 'src/orders/entity';

export class GetDeliveriesDto {
  @ApiProperty({ example: '123456789', description: 'Id of delivery' })
  id: string;

  @ApiProperty({ example: '1729145400', description: 'Created date as Unix timestamp' })
  createdAt: string;

  @ApiProperty({ example: '3600', description: 'Limit time to deliver (in seconds)' })
  limitTime: number;

  @ApiProperty({ example: '123456789', description: 'The ID of the staff that makes the delivery' })
  staffId: string | null;

  @ApiProperty({ example: 'PENDING', description: 'Latest status of delivery' })
  latestStatus: string;

  @ApiProperty({ example: '3', description: 'Number of orders in delivery' })
  numberOrder: number;
}
export class GetDeliveryDto {
  @ApiProperty({ example: '123456789', description: 'Id of delivery' })
  id: string;

  @ApiProperty({ example: '1729145400', description: 'Created date as Unix timestamp' })
  createdAt: string;

  @ApiProperty({ example: '3600', description: 'Limit time to deliver (in seconds)' })
  limitTime: number;

  @ApiProperty({ example: '123456789', description: 'The ID of the staff that makes the delivery' })
  staffId: string | null;

  DeliveryStatusHistory: GetDeliveryStatusDto[];

  orders: DeliveryOrderDto[];
}

export class GetDeliveryStatusDto {
  @ApiProperty({ example: '123456789', description: 'Id of delivery status' })
  id: string;

  @ApiProperty({ example: '123456789', description: 'Id of delivery' })
  deliveryId: string;

  @ApiProperty({ example: 'PENDING', description: 'Status of delivery' })
  status: string;

  @ApiProperty({ example: 'Something went wrong', description: 'Reason for this status' })
  reason: string | null;

  @ApiProperty({ example: '1729145400', description: 'Created date as Unix timestamp' })
  time: string;
}

export class DeliveryOrderDto extends OrderEntity {
  studentInfo: {
    lastName: string;
    firstName: string;
    phoneNumber: string;
    photoUrl: string;
  };
}
