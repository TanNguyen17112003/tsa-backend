import { ApiProperty } from '@nestjs/swagger';
import { Delivery, DeliveryStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { RestrictProperties } from 'src/types';

export class DeliveryEntity implements RestrictProperties<DeliveryEntity, Delivery> {
  @ApiProperty({ example: '123456789', description: 'Id of delivery' })
  @IsString()
  id: string;

  @ApiProperty({ example: '1729145400', description: 'Created date as Unix timestamp' })
  @IsString()
  createdAt: string;

  @ApiProperty({ example: '3600', description: 'Limit time to deliver (in seconds)' })
  @IsInt()
  limitTime: number;

  @ApiProperty({ example: '123456789', description: 'The ID of the staff that makes the delivery' })
  @IsString()
  @IsOptional()
  staffId: string | null;

  @ApiProperty({ example: 'PENDING', description: 'Latest status of delivery' })
  @IsEnum(DeliveryStatus)
  latestStatus: DeliveryStatus;

  @ApiProperty({ example: '3', description: 'Number of orders in delivery' })
  @IsInt()
  numberOrder: number;

  @IsString()
  displayId: string;
}
