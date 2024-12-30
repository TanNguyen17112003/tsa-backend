import { ApiProperty } from '@nestjs/swagger';

export class StaffOrdersStatsDto {
  @ApiProperty({ example: 10, description: 'Total orders' })
  totalOrders: number;

  @ApiProperty({ example: 100000, description: 'Total shipping fee' })
  totalShippingFee: number;

  @ApiProperty({ description: 'Percentage of order per brand' })
  brandPercentages: {
    brand: string;
    count: number;
    percentage: number;
  }[];
}

export class StudentOrdersStatsDto {
  @ApiProperty({ example: 10, description: 'Total orders last week' })
  totalOrdersLastWeek: number;

  @ApiProperty({ example: 10, description: 'Total orders last month' })
  totalOrdersLastMonth: number;

  @ApiProperty({ description: 'Percentage of order per brand' })
  brandPercentages: {
    brand: string;
    count: number;
    percentage: number;
  }[];
}
