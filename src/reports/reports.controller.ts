// src/reports/reports.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Auth, GetUser } from 'src/auth';
import { GetUserType } from 'src/types';

import { CreateReport, ReportQueryDto, UpdateReport } from './dtos';
import { ReportEntity } from './entity/report.entity';
import { ReportsService } from './reports.service';

@Controller('api/reports')
@ApiTags('Reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @Auth('STUDENT')
  @ApiCreatedResponse({ type: ReportEntity })
  create(@Body() createReportDto: CreateReport, @GetUser() user: GetUserType) {
    return this.reportsService.createReport(createReportDto, user);
  }

  @Get()
  @Auth('ADMIN', 'STUDENT')
  @ApiOkResponse({ type: [ReportEntity] })
  findAll(@Query() query: ReportQueryDto, @GetUser() user: GetUserType) {
    return this.reportsService.getReports(query, user);
  }

  @Get(':id')
  @Auth('ADMIN', 'STUDENT')
  @ApiOkResponse({ type: ReportEntity })
  findOne(@Param('id') id: string) {
    return this.reportsService.getReport(id);
  }

  @Patch(':id')
  @Auth()
  @ApiOkResponse({ type: ReportEntity })
  async update(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReport,
    @GetUser() user: GetUserType
  ) {
    return this.reportsService.updateReport(id, updateReportDto, user);
  }

  @Delete(':id')
  @Auth('ADMIN', 'STUDENT')
  async remove(@Param('id') id: string, @GetUser() user: GetUserType) {
    return this.reportsService.deleteReport(id, user);
  }
}
