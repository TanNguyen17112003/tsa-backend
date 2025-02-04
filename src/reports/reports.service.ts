import { Injectable, NotFoundException } from '@nestjs/common';
import { checkRowLevelPermission } from 'src/auth';
import { PageResponseDto } from 'src/common/dtos/page-response.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { convertToUnixTimestamp, shortenUUID } from 'src/orders/utils/order.util';
import { PrismaService } from 'src/prisma';
import { GetUserType } from 'src/types';

import { CreateReport, ReportQueryDto, UpdateReport } from './dtos';
import { ReportEntity } from './entity/report.entity';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService
  ) {}

  async createReport(createReportDto: CreateReport, user: GetUserType) {
    checkRowLevelPermission(user, createReportDto.studentId);
    return this.prisma.report.create({ data: createReportDto });
  }

  async getReports(
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

  async getReport(id: string) {
    return this.prisma.report.findUnique({ where: { id } });
  }

  async updateReport(id: string, updateReportDto: UpdateReport, user: GetUserType) {
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
      this.notificationsService.sendNotification({
        type: 'REPORT',
        title: 'Phản hồi khiếu nại',
        content: `Khiếu nại cho đơn hàng ${shortenUUID(order.checkCode, 'ORDER')} của bạn đã được phản hồi`,
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

  async deleteReport(id: string, user: GetUserType) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    checkRowLevelPermission(user, report.replierId);
    return this.prisma.report.delete({ where: { id } });
  }
}
