import { ApiProperty } from '@nestjs/swagger';

export class RecognitionResponseDto {
  @ApiProperty({ description: 'OrderId', example: 'abcd1234' })
  readonly orderId: string;
  @ApiProperty({ description: 'Brand', example: 'Shopee' })
  readonly brand: string;
}
