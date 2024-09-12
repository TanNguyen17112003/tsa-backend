import { Prisma } from '@prisma/client';
import { IsIn, IsOptional } from 'class-validator';
import { BaseQueryDto } from 'src/common/dtos/common.dto';

export class OrderQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsIn(Object.values(Prisma.OrderScalarFieldEnum))
  sortBy?: string;

  @IsOptional()
  @IsIn(Object.values(Prisma.OrderScalarFieldEnum))
  searchBy?: string;
}
