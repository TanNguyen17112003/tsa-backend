import { PageResponseDto } from 'src/common/dtos/page-response.dto';
import { GetUserType } from 'src/types';

import { CreateReport, ReportQueryDto, UpdateReport } from './dtos';
import { ReportEntity } from './entity/report.entity';

export abstract class ReportsService {
  abstract createReport(createReportDto: CreateReport, user: GetUserType): Promise<ReportEntity>;

  abstract getReports(
    query: ReportQueryDto,
    user: GetUserType
  ): Promise<PageResponseDto<ReportEntity>>;

  abstract getReport(id: string): Promise<ReportEntity>;

  abstract updateReport(
    id: string,
    updateReportDto: UpdateReport,
    user: GetUserType
  ): Promise<ReportEntity>;

  abstract deleteReport(id: string, user: GetUserType): Promise<ReportEntity>;
}
