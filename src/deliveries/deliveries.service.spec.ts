import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryStatus, OrderStatus } from '@prisma/client';
import { DateService } from 'src/date';
import { IdGeneratorService } from 'src/id-generator';
import { NotificationsService } from 'src/notifications';
import { PrismaService } from 'src/prisma';

import { DeliveriesService } from './deliveries.service';

describe('DeliveriesService', () => {
  let service: DeliveriesService;
  let prismaService: PrismaService;
  let dateService: DateService;
  let notificationService: NotificationsService;
  let idGeneratorService: IdGeneratorService;

  const mockPrismaService = {
    order: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    orderStatusHistory: {
      create: jest.fn(),
    },
    delivery: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    deliveryStatusHistory: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const mockDateService = {
    getCurrentUnixTimestamp: jest.fn(() => 1234567890),
  };
  const mockNotificationsService = {
    sendNotification: jest.fn(),
  };
  const mockIdGeneratorService = {
    generateUniqueId: jest.fn(() => 'uniqueId'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: DateService,
          useValue: mockDateService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: IdGeneratorService,
          useValue: mockIdGeneratorService,
        },
      ],
    }).compile();

    service = module.get<DeliveriesService>(DeliveriesService);
    prismaService = module.get<PrismaService>(PrismaService);
    dateService = module.get<DateService>(DateService);
    notificationService = module.get<NotificationsService>(NotificationsService);
    idGeneratorService = module.get<IdGeneratorService>(IdGeneratorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDelivery', () => {
    it('should throw BadRequestException if any order does not exist', async () => {
      mockPrismaService.order.findMany.mockResolvedValueOnce([]);

      await expect(
        service.createDelivery({
          orderIds: ['order1', 'order2'],
          staffId: 'staffId',
          limitTime: 123,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if orders are already assigned to deliveries', async () => {
      mockPrismaService.order.findMany.mockResolvedValueOnce([
        { id: 'order1', deliveries: [{}], latestStatus: OrderStatus.IN_TRANSPORT },
        { id: 'order2', deliveries: [], latestStatus: OrderStatus.PENDING },
      ]);

      await expect(
        service.createDelivery({
          orderIds: ['order1', 'order2'],
          staffId: 'staffId',
          limitTime: 123,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a delivery successfully', async () => {
      mockPrismaService.order.findMany.mockResolvedValueOnce([
        { id: 'order1', deliveries: [], latestStatus: OrderStatus.PENDING },
        { id: 'order2', deliveries: [], latestStatus: OrderStatus.PENDING },
      ]);
      mockPrismaService.$transaction.mockImplementationOnce((callback) => callback(prismaService));
      mockPrismaService.delivery.create.mockResolvedValueOnce({ id: 'delivery1' });

      const result = await service.createDelivery({
        orderIds: ['order1', 'order2'],
        staffId: 'staffId',
        limitTime: 123,
      });

      expect(result).toEqual({ id: 'delivery1' });
      expect(prismaService.delivery.create).toHaveBeenCalled();
      expect(notificationService.sendNotification).toHaveBeenCalled();
      expect(dateService.getCurrentUnixTimestamp).toHaveBeenCalled();
      expect(idGeneratorService.generateUniqueId).toHaveBeenCalled();
    });
  });

  describe('getDeliveries', () => {
    it('should return deliveries for admin', async () => {
      const mockDeliveries = [
        { id: 'delivery1', staffId: 'staffId1' },
        { id: 'delivery2', staffId: 'staffId2' },
      ];
      mockPrismaService.delivery.findMany.mockResolvedValueOnce(mockDeliveries);

      const result = await service.getDeliveries({
        role: 'ADMIN',
        id: 'adminId',
        email: 'test-email@example.com',
      });

      expect(result).toEqual(mockDeliveries);
    });

    it('should return deliveries for staff', async () => {
      const mockDeliveries = [{ id: 'delivery1', staffId: 'staffId1' }];
      mockPrismaService.delivery.findMany.mockResolvedValueOnce(mockDeliveries);

      const result = await service.getDeliveries({
        role: 'STAFF',
        id: 'staffId1',
        email: 'test-email@example.com',
      });

      expect(result).toEqual(mockDeliveries);
      expect(prismaService.delivery.findMany).toHaveBeenCalledWith({
        where: {
          staffId: mockDeliveries[0].staffId,
        },
      });
    });
  });

  describe('getDelivery', () => {
    it('should throw NotFoundException if delivery not found', async () => {
      mockPrismaService.delivery.findUnique.mockResolvedValueOnce(null);
      await expect(service.getDelivery('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should return a delivery with sorted orders', async () => {
      mockPrismaService.delivery.findUnique.mockResolvedValueOnce({
        id: 'delivery1',
        DeliveryStatusHistory: [],
        orders: [
          { orderSequence: 2, order: { id: 'order2', student: { user: {} } } },
          { orderSequence: 1, order: { id: 'order1', student: { user: {} } } },
        ],
      });

      const result = await service.getDelivery('delivery1');
      expect(result.orders[0].id).toBe('order1');
      expect(result.orders[1].id).toBe('order2');
    });
  });

  describe('updateDelivery', () => {
    it('should throw NotFoundException if delivery does not exist', async () => {
      mockPrismaService.delivery.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updateDelivery('nonexistent', { orderIds: ['order1'], limitTime: 123 })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if delivery is not pending', async () => {
      mockPrismaService.delivery.findUnique.mockResolvedValueOnce({
        id: 'delivery1',
        latestStatus: 'ACCEPTED',
      });

      await expect(
        service.updateDelivery('delivery1', { orderIds: ['order1'], limitTime: 123 })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if any order does not exist', async () => {
      mockPrismaService.delivery.findUnique.mockResolvedValueOnce({
        id: 'delivery1',
        latestStatus: 'PENDING',
      });
      mockPrismaService.order.findMany.mockResolvedValueOnce([]);

      await expect(
        service.updateDelivery('delivery1', { orderIds: ['order1'], limitTime: 123 })
      ).rejects.toThrow(BadRequestException);
    });

    it('should update the delivery successfully', async () => {
      mockPrismaService.delivery.findUnique.mockResolvedValueOnce({
        id: 'delivery1',
        latestStatus: 'PENDING',
      });
      mockPrismaService.order.findMany.mockResolvedValueOnce([{ id: 'order1' }]);
      mockPrismaService.delivery.update.mockResolvedValueOnce({
        id: 'delivery1',
        limitTime: 123,
      });

      const result = await service.updateDelivery('delivery1', {
        orderIds: ['order1'],
        limitTime: 123,
      });

      expect(result).toEqual({ id: 'delivery1', limitTime: 123 });
      expect(prismaService.delivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery1' },
        data: {
          limitTime: 123,
          orders: {
            createMany: {
              data: [{ orderId: 'order1', orderSequence: 1 }],
            },
          },
        },
      });
    });
  });

  describe('updateDeliveryStatus', () => {
    it('should throw BadRequestException if staff is already delivering another delivery', async () => {
      mockPrismaService.delivery.findFirst.mockResolvedValueOnce({
        id: 'delivery1',
        latestStatus: 'ACCEPTED',
      });

      await expect(
        service.updateDeliveryStatus(
          'delivery2',
          { status: 'ACCEPTED' },
          { id: 'staffId', role: 'STAFF', email: 'test@example.com' }
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if delivery does not exist', async () => {
      mockPrismaService.delivery.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updateDeliveryStatus(
          'nonexistent',
          { status: 'CANCELED' },
          { id: 'staffId', role: 'STAFF', email: 'test@example.com' }
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if delivery cannot be canceled due to order status', async () => {
      mockPrismaService.delivery.findUnique.mockResolvedValueOnce({
        id: 'delivery1',
        orders: [{ order: { latestStatus: 'CANCELED' } }, { order: { latestStatus: 'DELIVERED' } }],
      });

      await expect(
        service.updateDeliveryStatus(
          'delivery1',
          {
            status: 'CANCELED',
            canceledImage:
              'http://res.cloudinary.com/diceqlufb/image/upload/v1746938054/tsa_image/ukbbpfdgrrkiwhunbapc.jpg',
            reason: 'Hư xe',
          },
          { id: 'staffId', role: 'STAFF', email: 'test@example.com' }
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should update delivery status to ACCEPTED successfully', async () => {
      mockPrismaService.delivery.findFirst.mockResolvedValueOnce(null);
      mockPrismaService.delivery.findUnique.mockResolvedValueOnce({
        id: 'delivery1',
        orders: [{ orderId: 'order1' }, { orderId: 'order2' }],
      });
      mockPrismaService.delivery.update.mockResolvedValueOnce({
        id: 'delivery1',
        latestStatus: 'ACCEPTED',
      });

      const result = await service.updateDeliveryStatus(
        'delivery1',
        { status: 'ACCEPTED' },
        { id: 'staffId', role: 'STAFF', email: 'test@example.com' }
      );

      expect(result).toEqual({ id: 'delivery1', latestStatus: 'ACCEPTED' });
      expect(prismaService.delivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery1' },
        data: {
          DeliveryStatusHistory: {
            create: {
              status: 'ACCEPTED',
              time: expect.any(String),
              reason: undefined,
            },
          },
          latestStatus: 'ACCEPTED',
        },
      });
    });

    it('should update delivery status to CANCELED successfully', async () => {
      mockPrismaService.delivery.findUnique.mockResolvedValueOnce({
        id: 'delivery1',
        orders: [{ orderId: 'order1', order: { latestStatus: 'PENDING' } }],
      });
      mockPrismaService.delivery.update.mockResolvedValueOnce({
        id: 'delivery1',
        latestStatus: 'CANCELED',
      });

      const result = await service.updateDeliveryStatus(
        'delivery1',
        {
          status: 'CANCELED',
          canceledImage:
            'http://res.cloudinary.com/diceqlufb/image/upload/v1746938054/tsa_image/ukbbpfdgrrkiwhunbapc.jpg',
          reason: 'Hư xe',
        },
        { id: 'staffId', role: 'STAFF', email: 'test@example.com' }
      );

      expect(result).toEqual({ id: 'delivery1', latestStatus: 'CANCELED' });
      expect(prismaService.delivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery1' },
        data: {
          DeliveryStatusHistory: {
            create: {
              status: 'CANCELED',
              time: expect.any(String),
              reason: 'Lý do cá nhân',
            },
          },
          latestStatus: 'CANCELED',
        },
      });
    });
  });

  describe('deleteDelivery', () => {
    it('should throw NotFoundException if delivery does not exist', async () => {
      mockPrismaService.delivery.findUnique.mockResolvedValueOnce(null);

      await expect(service.deleteDelivery('123')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if delivery is not pending', async () => {
      mockPrismaService.delivery.findUnique.mockResolvedValueOnce({ id: '123' });
      mockPrismaService.deliveryStatusHistory.findFirst.mockResolvedValueOnce({
        status: DeliveryStatus.ACCEPTED,
      });

      await expect(service.deleteDelivery('123')).rejects.toThrow(BadRequestException);
    });

    it('should delete delivery if pending', async () => {
      mockPrismaService.delivery.findUnique.mockResolvedValueOnce({ id: '123' });
      mockPrismaService.deliveryStatusHistory.findFirst.mockResolvedValueOnce({
        status: DeliveryStatus.PENDING,
      });
      mockPrismaService.delivery.delete.mockResolvedValueOnce({ id: '123' });

      const result = await service.deleteDelivery('123');
      expect(result).toEqual({ id: '123' });
    });
  });
});
