import { $Enums, Report } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';
import { RestrictProperties } from 'src/common/types';

export class ReportEntity implements RestrictProperties<ReportEntity, Report> {
  @IsString()
  id: string;
  @IsString()
  orderId: string;
  @IsString()
  content: string;
  @IsString()
  reportedAt: string;
  @IsString()
  proof: string;
  @IsString()
  @IsOptional()
  reply: string;
  @IsString()
  @IsOptional()
  repliedAt: string;
  status: $Enums.ReportStatus;
  @IsString()
  @IsOptional()
  replierId: string;
  @IsString()
  studentId: string;
}
