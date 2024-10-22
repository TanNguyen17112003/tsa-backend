// src/payment/dto/momo-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MomoRequestDto {
  @ApiProperty({ example: '100000', description: 'Amount of money' })
  @IsString()
  readonly amount: string;

  @ApiProperty({ example: '111111', description: 'Order ID' })
  @IsString()
  readonly orderId: string;

  @ApiProperty({ example: 'Thanh toán đơn hàng với MOMO', description: 'Info of payment service' })
  @IsString()
  readonly orderInfo: string;

  @ApiProperty({
    example: 'https://yourdomain.com/return',
    description: 'URL to return after paying MOMO',
  })
  @IsString()
  readonly returnUrl: string;

  @ApiProperty({
    example: 'https://yourdomain.com/notify',
    description: 'URL to notify after paying MOMO',
  })
  @IsString()
  readonly notifyUrl: string;

  @ApiProperty({ example: 'extra-data', description: 'Extra data', required: false })
  @IsOptional()
  @IsString()
  readonly extraData?: string;
}
