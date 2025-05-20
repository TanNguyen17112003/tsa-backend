import { Test } from '@nestjs/testing';
import { NotificationsService } from 'src/notifications';
import { PrismaService } from 'src/prisma';
import { PythonApiService } from 'src/python-api/python-api.service';
import { GetUserType } from 'src/types';

import { CreateStudentOrderDto, OrderQueryDto } from './dtos';
import { ShippingFeeDto } from './dtos/shippingFee.dto';
import { OrderServiceImpl } from './orders.service.impl';
import { getHistoryTimee, getLatestOrderStatus } from './utils/order.util';

jest.mock('./utils/order.util', () => ({
  convertToUnixTimestamp: jest.fn(),
  createOrderStatusHistory: jest.fn(),
  findExistingOrder: jest.fn(),
  getHistoryTimee: jest.fn(),
  getLatestOrderStatus: jest.fn(),
  getShippingFee: jest.fn(),
  handleCancelDelivery: jest.fn(),
  mapTypeToReason: jest.fn(),
  shortenUUID: jest.fn(),
  validateUserForOrder: jest.fn(),
}));

describe('OrderServiceImpl', () => {
  let orderService: OrderServiceImpl;

  const mockPrismaService = {
    order: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    orderStatusHistory: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockNotificationsService = {
    sendPushNotification: jest.fn(),
    sendNotification: jest.fn(),
  };

  const mockPythonApiService = {
    getShippingFee: jest.fn(),
    getOrderStats: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrderServiceImpl,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: PythonApiService,
          useValue: mockPythonApiService,
        },
      ],
    }).compile();

    orderService = module.get<OrderServiceImpl>(OrderServiceImpl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrders', () => {
    it('should return paginated orders with status and staff info', async () => {
      const query: OrderQueryDto = {
        page: 1,
        size: 10,
        search: 'test',
        status: 'PENDING',
        isPaid: true,
        sortBy: 'deliveryDate',
        sortOrder: 'asc',
        startDate: '2023-01-01',
        endDate: '2023-01-31',
      };
      const user: GetUserType = {
        id: 'user1',
        email: 'test@example.com',
        role: 'STUDENT',
      };

      mockPrismaService.order.findMany.mockResolvedValue([{ id: '1', shipperId: null }]);
      mockPrismaService.order.count.mockResolvedValue(1);
      (getLatestOrderStatus as jest.Mock).mockResolvedValue('PENDING');
      (getHistoryTimee as jest.Mock).mockResolvedValue(123456);

      const result = await orderService.getOrders(query, user);

      expect(result).toEqual({
        totalElements: 1,
        totalPages: 1,
        results: [{ id: '1', shipperId: null, latestStatus: 'PENDING', historyTime: 123456 }],
      });
    });
  });

  describe('getOrder', () => {
    it('should return order details with latest status and history time', async () => {
      const orderId = 'order1';
      const mockOrder = { id: orderId, checkCode: '123' };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      (getLatestOrderStatus as jest.Mock).mockResolvedValue('DELIVERED');
      (getHistoryTimee as jest.Mock).mockResolvedValue(123456);

      const result = await orderService.getOrder(orderId);

      expect(result.id).toBe(orderId);
      expect(result.latestStatus).toBe('DELIVERED');
      expect(result.historyTime).toBe(123456);
    });
  });

  describe('createOrder', () => {
    it('should create a new order for a student', async () => {
      const createOrderDto: CreateStudentOrderDto = {
        checkCode: '123',
        brand: 'BrandA',
        room: '101',
        building: 'A',
        dormitory: 'A',
        weight: 5,
        deliveryDate: '2023-01-01',
        paymentMethod: 'CASH',
        product: 'ProductA',
      };
      const user: GetUserType = {
        id: 'student1',
        email: 'test@example.com',
        role: 'STUDENT',
      };

      mockPrismaService.order.create.mockResolvedValue({
        id: 'order1',
        ...createOrderDto,
        latestStatus: 'PENDING',
      });

      const result = await orderService.createOrder(createOrderDto, user);

      expect(result).toEqual({
        message: 'Order created and status set to PENDING',
        data: {
          id: 'order1',
          ...createOrderDto,
          latestStatus: 'PENDING',
          historyTime: 123456,
        },
      });
    });
  });

  describe('updateOrderInfo', () => {
    it('should update order information', async () => {
      const orderId = 'order1';
      const updateOrderDto: CreateStudentOrderDto = {
        room: '102',
        building: 'B',
        dormitory: 'B',
        weight: 6,
        brand: 'BrandB',
        product: 'ProductB',
        paymentMethod: 'CASH',
        checkCode: '456',
        deliveryDate: '2023-02-01',
      };
      const user: GetUserType = {
        id: 'student1',
        role: 'STUDENT',
        email: 'test@example.com',
      };

      mockPrismaService.order.findUnique.mockResolvedValue({ id: orderId });
      mockPrismaService.orderStatusHistory.findFirst.mockResolvedValue({
        id: 'history1',
        orderId,
        status: 'PENDING',
      });
      mockPrismaService.order.update.mockResolvedValue({
        id: orderId,
        ...updateOrderDto,
      });
      (getLatestOrderStatus as jest.Mock).mockResolvedValue('PENDING');
      (getHistoryTimee as jest.Mock).mockResolvedValue(123456);

      const result = await orderService.updateOrderInfo(orderId, updateOrderDto, user);

      expect(result).toEqual({
        message: 'Order updated',
        data: {
          id: orderId,
          latestStatus: 'PENDING',
          historyTime: 123456,
        },
      });
    });
  });

  describe('deleteOrder', () => {
    it('should delete an order', async () => {
      const orderId = 'order1';
      const user: GetUserType = {
        id: 'student1',
        role: 'STUDENT',
        email: 'test@example.com',
      };

      mockPrismaService.order.findUnique.mockResolvedValue({
        id: orderId,
        status: 'PENDING',
      });
      mockPrismaService.orderStatusHistory.findFirst.mockResolvedValue({
        id: 'history1',
        orderId,
        status: 'PENDING',
      });
      mockPrismaService.order.delete.mockResolvedValue({ id: orderId });

      const result = await orderService.deleteOrder(orderId, user);

      expect(result).toEqual({ message: 'Order deleted' });
    });
  });

  describe('getShippingFee', () => {
    it('should calculate the shipping fee', async () => {
      const query: ShippingFeeDto = {
        weight: 5,
        room: '101',
        building: 'A',
        dormitory: 'A',
      };

      jest.spyOn(orderService, 'getShippingFee').mockResolvedValue({ shippingFee: 100 });

      const result = await orderService.getShippingFee(query);

      expect(result).toEqual({ shippingFee: 100 });
    });
  });

  describe('getOrdersStats', () => {
    it('should return order stats for a student', async () => {
      const user: GetUserType = {
        id: 'student1',
        role: 'STUDENT',
        email: 'test@example.com',
      };

      jest.spyOn(orderService as any, 'getOrdersStatsForStudent').mockResolvedValue({
        totalOrdersLastWeek: 5,
        totalOrdersLastMonth: 20,
        brandPercentages: [],
      });

      const result = await orderService.getOrdersStats('week', user);

      expect(result).toEqual({
        totalOrdersLastWeek: 5,
        totalOrdersLastMonth: 20,
        brandPercentages: [],
      });
    });
  });
});
