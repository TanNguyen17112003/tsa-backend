import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class OrderQueryDto {
  @ApiProperty({ default: 1, required: false, description: 'Page number' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page: number = 3;

  @ApiProperty({ default: 10, required: false, description: 'Number of items per page' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  size: number = 10;

  @ApiProperty({ required: false, description: 'Search term for checkCode or product' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, description: 'Filter by payment status', type: Boolean })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : undefined))
  @IsBoolean()
  isPaid?: boolean;

  @ApiProperty({ required: false, description: 'Field to sort by' })
  @IsOptional()
  @IsIn(Object.values(Prisma.OrderScalarFieldEnum))
  sortBy?: string;

  @ApiProperty({ required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiProperty({
    required: false,
    description: 'Start date for filtering deliveryDate in YYYY-MM-DD format',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    required: false,
    description: 'End date for filtering deliveryDate in YYYY-MM-DD format',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
