import { Prisma } from '@prisma/client';
import { IsIn, IsOptional } from 'class-validator';
import { BaseQueryDto } from 'src/common/dtos/common.dto';

export class ReportQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsIn(Object.values(Prisma.ReportScalarFieldEnum))
  sortBy?: string;

  @IsOptional()
  @IsIn(Object.values(Prisma.ReportScalarFieldEnum))
  searchBy?: string;
}
