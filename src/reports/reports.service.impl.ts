import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { checkRowLevelPermission } from 'src/auth';
import { PageResponseDto } from 'src/common/dtos/page-response.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { convertToUnixTimestamp, shortenUUID } from 'src/orders/utils/order.util';
import { PrismaService } from 'src/prisma';
import { GetUserType } from 'src/types';

import { CreateReport, ReportQueryDto, UpdateReport } from './dtos';
import { ReportEntity } from './entity/report.entity';
import { ReportsService } from './reports.service';

@Injectable()
export class ReportsServiceImpl extends ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService
  ) {
    super();
  }

  override async createReport(
    createReportDto: CreateReport,
    user: GetUserType
  ): Promise<ReportEntity> {
    checkRowLevelPermission(user, createReportDto.studentId);
    const { orderId } = createReportDto;
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId },
      });
      if (!order) throw new BadRequestException('Không tìm thấy đơn hàng dưới hệ thống');
      const report = await tx.report.create({
        data: createReportDto,
      });
      return report;
    });
  }

  override async getReports(
    query: ReportQueryDto,
    user: GetUserType
  ): Promise<PageResponseDto<ReportEntity>> {
    const { page, size, sortBy, sortOrder, startDate, endDate, status } = query;
    const where: any = {};
    checkRowLevelPermission(user, user.id);
    if (user.role === 'STUDENT') {
      where.studentId = user.id;
    }
    if (status) {
      where.status = status;
    }
    if (startDate) {
      where.reportedAt = {
        gte: convertToUnixTimestamp(startDate),
      };
    }
    if (endDate) {
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.reportedAt = {
        ...where.reportedAt,
        lte: convertToUnixTimestamp(nextDay.toISOString().split('T')[0]),
      };
    }
    const orderBy: any[] = [];
    if (sortBy) {
      orderBy.push({
        [sortBy]: sortOrder || 'asc',
      });
    }
    const [reports, totalElements] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy,
      }),
      this.prisma.report.count({ where }),
    ]);

    const totalPages = Math.ceil(totalElements / size);
    return {
      totalElements,
      totalPages,
      results: reports,
    };
  }

  override async getReport(id: string) {
    return this.prisma.report.findUnique({ where: { id } });
  }

  override async updateReport(id: string, updateReportDto: UpdateReport, user: GetUserType) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    const order = await this.prisma.order.findUnique({
      where: {
        id: report.orderId,
      },
    });
    checkRowLevelPermission(user, report.replierId);
    if (user.role === 'ADMIN' && updateReportDto.reply) {
      this.notificationsService.sendFullNotification({
        type: 'REPORT',
        title: 'Phản hồi khiếu nại',
        message: `Khiếu nại cho đơn hàng ${shortenUUID(order.checkCode, 'ORDER')} của bạn đã được phản hồi`,
        reportId: report.id,
        userId: report.studentId,
        deliveryId: undefined,
        orderId: undefined,
      });
    }
    return this.prisma.report.update({
      where: { id },
      data: updateReportDto,
    });
  }

  override async deleteReport(id: string, user: GetUserType) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    checkRowLevelPermission(user, report.replierId);
    return this.prisma.report.delete({ where: { id } });
  }
}
