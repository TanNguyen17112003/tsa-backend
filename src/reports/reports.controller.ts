// src/reports/reports.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AllowAuthenticated, GetUser } from 'src/auth';
import { GetUserType } from 'src/types';

import { CreateReport, ReportQueryDto, UpdateReport } from './dtos';
import { ReportEntity } from './entity/report.entity';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@Controller('api/reports')
@ApiBearerAuth('JWT-Auth')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @AllowAuthenticated('STUDENT')
  @ApiCreatedResponse({ type: ReportEntity })
  @Post()
  create(@Body() createReportDto: CreateReport, @GetUser() user: GetUserType) {
    return this.reportsService.createReport(createReportDto, user);
  }

  @AllowAuthenticated('ADMIN', 'STUDENT')
  @ApiOkResponse({ type: [ReportEntity] })
  @Get()
  findAll(@Query() query: ReportQueryDto, @GetUser() user: GetUserType) {
    return this.reportsService.getReports(query, user);
  }

  @AllowAuthenticated('ADMIN', 'STUDENT')
  @ApiOkResponse({ type: ReportEntity })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.getReport(id);
  }

  @ApiOkResponse({ type: ReportEntity })
  @AllowAuthenticated()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReport,
    @GetUser() user: GetUserType
  ) {
    return this.reportsService.updateReport(id, updateReportDto, user);
  }

  @AllowAuthenticated('ADMIN', 'STUDENT')
  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser() user: GetUserType) {
    return this.reportsService.deleteReport(id, user);
  }
}
