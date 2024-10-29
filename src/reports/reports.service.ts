import { Injectable, NotFoundException } from '@nestjs/common';
import { checkRowLevelPermission } from 'src/auth';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PrismaService } from 'src/prisma';
import { GetUserType } from 'src/types';

import { CreateReport, ReportQueryDto, UpdateReport } from './dtos';

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

  async getReports(query: ReportQueryDto, user: GetUserType) {
    const { skip, take, order, sortBy } = query;
    checkRowLevelPermission(user, user.id);
    const studentId = user.role === 'STUDENT' ? user.id : null;
    return this.prisma.report.findMany({
      ...(skip ? { skip: +skip } : null),
      ...(take ? { take: +take } : null),
      ...(sortBy ? { orderBy: { [sortBy]: order || 'asc' } } : null),
      where: studentId ? { studentId } : {},
    });
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
        content: `Khiếu nại cho đơn hàng ${order.checkCode} của bạn đã được phản hồi`,
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
