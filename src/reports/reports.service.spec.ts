import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from 'src/notifications';
import { PrismaService } from 'src/prisma';
import { GetUserType } from 'src/types';

import { ReportsService } from './reports.service';

jest.mock('src/auth', () => ({
  checkRowLevelPermission: jest.fn(),
}));

jest.mock('src/orders/utils/order.util', () => ({
  convertToUnixTimestamp: jest.fn((date) => new Date(date).getTime()),
  shortenUUID: jest.fn((uuid) => `short-${uuid}`),
}));

describe('ReportsService', () => {
  let service: ReportsService;

  const mockPrisma = {
    $transaction: jest.fn(),
    report: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockNotifications = {
    sendNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: NotificationsService,
          useValue: mockNotifications,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createReport', () => {
    it('should create a report inside transaction', async () => {
      const dto = { studentId: '1', orderId: 'order1' };
      const user = { id: '1' } as GetUserType;

      mockPrisma.$transaction.mockImplementation(async (cb) =>
        cb({
          order: {
            findFirst: jest.fn().mockResolvedValue({ id: 'order1' }),
          },
          report: {
            create: jest.fn().mockResolvedValue({ id: 'report1' }),
          },
        })
      );

      const result = await service.createReport(dto as any, user);
      expect(result).toEqual({ id: 'report1' });
    });

    it('should throw if order not found', async () => {
      const dto = { studentId: '1', orderId: 'missingOrder' };
      const user = { id: '1' } as GetUserType;

      mockPrisma.$transaction.mockImplementation(async (cb) =>
        cb({
          order: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          report: {
            create: jest.fn(),
          },
        })
      );

      await expect(service.createReport(dto as any, user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getReports', () => {
    it('should return paginated results', async () => {
      const query = {
        page: 1,
        size: 10,
        sortBy: 'reportedAt',
        sortOrder: 'desc',
        status: 'PENDING',
        startDate: '2024-01-01',
        endDate: '2024-01-10',
      };
      const user = { id: '1', role: 'STUDENT' } as GetUserType;

      mockPrisma.report.findMany.mockResolvedValue([{ id: '1' }]);
      mockPrisma.report.count.mockResolvedValue(1);

      const result = await service.getReports(query as any, user);
      expect(result.results).toHaveLength(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('getReport', () => {
    it('should return a report by ID', async () => {
      mockPrisma.report.findUnique.mockResolvedValue({ id: 'report1' });
      const result = await service.getReport('report1');
      expect(result).toEqual({ id: 'report1' });
    });
  });

  describe('updateReport', () => {
    it('should update report and send notification if ADMIN with reply', async () => {
      const user = { role: 'ADMIN', id: 'admin1' } as GetUserType;
      const updateDto = { reply: 'Your issue is resolved' };

      mockPrisma.report.findUnique.mockResolvedValue({
        id: 'r1',
        orderId: 'o1',
        replierId: 'admin1',
        studentId: 'student1',
      });
      mockPrisma.order.findUnique.mockResolvedValue({ checkCode: 'ABC123' });
      mockPrisma.report.update.mockResolvedValue({ id: 'r1', reply: 'Updated' });

      const result = await service.updateReport('r1', updateDto as any, user);
      expect(mockNotifications.sendNotification).toHaveBeenCalled();
      expect(result).toEqual({ id: 'r1', reply: 'Updated' });
    });

    it('should throw if report not found', async () => {
      mockPrisma.report.findUnique.mockResolvedValue(null);
      await expect(
        service.updateReport('missing', {} as any, { id: '1' } as GetUserType)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteReport', () => {
    it('should delete report if found', async () => {
      mockPrisma.report.findUnique.mockResolvedValue({ id: 'r1', replierId: 'user1' });
      mockPrisma.report.delete.mockResolvedValue({ id: 'r1' });

      const result = await service.deleteReport('r1', { id: 'user1' } as GetUserType);
      expect(result).toEqual({ id: 'r1' });
    });

    it('should throw if report not found', async () => {
      mockPrisma.report.findUnique.mockResolvedValue(null);
      await expect(service.deleteReport('missing', { id: '1' } as GetUserType)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
