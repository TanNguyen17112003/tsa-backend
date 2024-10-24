// src/payment/dto/momo-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PayOsRequestDto {
  @ApiProperty({ example: '100000', description: 'Amount of money' })
  @IsNumber()
  readonly amount: number;

  @ApiProperty({ example: '111111', description: 'Order ID' })
  @IsString()
  readonly orderId: string;

  @ApiProperty({ example: 'Thanh toán đơn hàng với PayOS', description: 'Info of payment service' })
  @IsString()
  readonly description: string;

  @ApiProperty({
    example: 'https://yourdomain.com/return',
    description: 'URL to return after paying MOMO',
  })
  @IsString()
  readonly returnUrl: string;

  @ApiProperty({
    example: 'https://yourdomain.com/notify',
    description: 'URL to return if having some errors',
  })
  @IsString()
  readonly cancelUrl: string;

  @ApiProperty({ example: 'extra-data', description: 'Extra data', required: false })
  @IsOptional()
  @IsString()
  readonly extraData?: string;
}
