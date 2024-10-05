import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AllowAuthenticated, checkRowLevelPermission, GetUser } from 'src/auth';
import { PrismaService } from 'src/prisma';
import { GetUserType } from 'src/types';

import { CreateReport, ReportQueryDto, UpdateReport } from './dtos';
import { ReportEntity } from './entity/report.entity';

@ApiTags('Reports')
@Controller('api/reports')
@ApiBearerAuth('JWT-Auth')
export class ReportsController {
  constructor(private readonly prisma: PrismaService) {}

  @AllowAuthenticated('STUDENT')
  @ApiCreatedResponse({ type: ReportEntity })
  @Post()
  create(@Body() createReportDto: CreateReport, @GetUser() user: GetUserType) {
    checkRowLevelPermission(user, createReportDto.studentId);
    return this.prisma.report.create({ data: createReportDto });
  }

  @AllowAuthenticated('ADMIN', 'STUDENT')
  @ApiOkResponse({ type: [ReportEntity] })
  @Get()
  findAll(@Query() { skip, take, order, sortBy }: ReportQueryDto, @GetUser() user: GetUserType) {
    checkRowLevelPermission(user, user.id);
    const studentId = user.role === 'STUDENT' ? user.id : null;
    return this.prisma.report.findMany({
      ...(skip ? { skip: +skip } : null),
      ...(take ? { take: +take } : null),
      ...(sortBy ? { orderBy: { [sortBy]: order || 'asc' } } : null),
      where: studentId ? { studentId } : {},
    });
  }

  @AllowAuthenticated('ADMIN', 'STUDENT')
  @ApiOkResponse({ type: ReportEntity })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prisma.report.findUnique({ where: { id } });
  }

  @ApiOkResponse({ type: ReportEntity })
  @AllowAuthenticated()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReport,
    @GetUser() user: GetUserType
  ) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    checkRowLevelPermission(user, report.replierId);
    return this.prisma.report.update({
      where: { id },
      data: updateReportDto,
    });
  }

  @AllowAuthenticated('ADMIN', 'STUDENT')
  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser() user: GetUserType) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    checkRowLevelPermission(user, report.replierId);
    return this.prisma.report.delete({ where: { id } });
  }
}
