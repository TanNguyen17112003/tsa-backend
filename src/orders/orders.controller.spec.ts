import { Test } from '@nestjs/testing';
import { GetUserType } from 'src/types';

import { CreateOrderDto, CreateStudentOrderDto, UpdateStatusDto } from './dtos';
import { DelayOrdersDto } from './dtos/delay.dto';
import { GroupOrdersDto } from './dtos/group.dto';
import { RouteOrdersDto } from './dtos/route.dto';
import { OrdersController } from './orders.controller';
import { OrderService } from './orders.service';

describe('OrdersController', () => {
  let ordersController: OrdersController;
  let orderService: OrderService;

  const mockOrderService = {
    getOrders: jest.fn(),
    getOrder: jest.fn(),
    createOrder: jest.fn(),
    updateOrderInfo: jest.fn(),
    updateStatus: jest.fn(),
    deleteOrder: jest.fn(),
    getShippingFee: jest.fn(),
    getOrdersStats: jest.fn(),
    getCurrentOrder: jest.fn(),
    groupOrders: jest.fn(),
    delayOrders: jest.fn(),
    routeOrders: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
      ],
    }).compile();

    ordersController = module.get<OrdersController>(OrdersController);
    orderService = module.get<OrderService>(OrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('group', () => {
    it('should call orderService.groupOrders with correct parameters', async () => {
      const groupOrdersDto: GroupOrdersDto = {
        maxWeight: 10,
        dormitory: 'A',
        timeslot: '1741161600',
        mode: 'balanced',
      };
      mockOrderService.groupOrders.mockResolvedValue('groupedOrders');

      const result = await ordersController.group(groupOrdersDto);

      expect(orderService.groupOrders).toHaveBeenCalledWith(groupOrdersDto);
      expect(result).toBe('groupedOrders');
    });
  });

  describe('delay', () => {
    it('should call orderService.delayOrders with correct parameters', async () => {
      const delayOrdersDto: DelayOrdersDto = {
        orderIds: ['orderId1', 'orderId2'],
        timeslot: '1741161600',
      };
      mockOrderService.delayOrders.mockResolvedValue('delayedOrders');

      const result = await ordersController.delay(delayOrdersDto);

      expect(orderService.delayOrders).toHaveBeenCalledWith(delayOrdersDto);
      expect(result).toBe('delayedOrders');
    });
  });

  describe('route', () => {
    it('should call orderService.routeOrders with correct parameters', async () => {
      const routeOrdersDto: RouteOrdersDto = {
        orders: [
          {
            id: 'orderId1',
            room: '102',
            building: 'A12',
            dormitory: 'A',
          },
          {
            id: 'orderId2',
            room: '102',
            building: 'A7',
            dormitory: 'A',
          },
        ],
      };
      mockOrderService.routeOrders.mockResolvedValue('routedOrders');

      const result = await ordersController.route(routeOrdersDto);

      expect(orderService.routeOrders).toHaveBeenCalledWith(routeOrdersDto);
      expect(result).toBe('routedOrders');
    });
  });

  describe('create', () => {
    it('should call orderService.createOrder with correct parameters', async () => {
      const createOrderDto = { studentId: '123' };
      const user: GetUserType = {
        id: 'userId',
        role: 'STUDENT',
        email: 'test@example.com',
      };
      mockOrderService.createOrder.mockResolvedValue('createdOrder');

      const result = await ordersController.create(createOrderDto as CreateOrderDto, user);

      expect(orderService.createOrder).toHaveBeenCalledWith(createOrderDto, user);
      expect(result).toBe('createdOrder');
    });
  });

  describe('getShippingFee', () => {
    it('should call orderService.getShippingFee with correct parameters', async () => {
      const query = { someKey: 'someValue' };
      mockOrderService.getShippingFee.mockResolvedValue('shippingFee');

      const result = await ordersController.getShippingFee(query as any);

      expect(orderService.getShippingFee).toHaveBeenCalledWith(query);
      expect(result).toBe('shippingFee');
    });
  });

  describe('findAll', () => {
    it('should call orderService.getOrders with correct parameters', async () => {
      const query = { someKey: 'someValue' };
      const user: GetUserType = {
        id: 'userId',
        role: 'STUDENT',
        email: 'test@example.com',
      };
      mockOrderService.getOrders.mockResolvedValue('ordersList');

      const result = await ordersController.findAll(query as any, user);

      expect(orderService.getOrders).toHaveBeenCalledWith(query, user);
      expect(result).toBe('ordersList');
    });
  });

  describe('getOrdersStats', () => {
    it('should call orderService.getOrdersStats with correct parameters', async () => {
      const type = 'week';
      const user: GetUserType = {
        id: 'userId',
        role: 'STUDENT',
        email: 'test@example.com',
      };
      mockOrderService.getOrdersStats.mockResolvedValue('orderStats');

      const result = await ordersController.getOrdersStats(type, user);

      expect(orderService.getOrdersStats).toHaveBeenCalledWith(type, user);
      expect(result).toBe('orderStats');
    });
  });

  describe('getCurrentOrder', () => {
    it('should call orderService.getCurrentOrder with correct parameters', async () => {
      const user: GetUserType = {
        id: 'userId',
        role: 'STUDENT',
        email: 'test@example.com',
      };
      mockOrderService.getCurrentOrder.mockResolvedValue('currentOrder');

      const result = await ordersController.getCurrentOrder(user);

      expect(orderService.getCurrentOrder).toHaveBeenCalledWith(user);
      expect(result).toBe('currentOrder');
    });
  });

  describe('findOne', () => {
    it('should call orderService.getOrder with correct parameters', async () => {
      const id = 'orderId';
      mockOrderService.getOrder.mockResolvedValue('order');

      const result = await ordersController.findOne(id);

      expect(orderService.getOrder).toHaveBeenCalledWith(id);
      expect(result).toBe('order');
    });
  });

  describe('updateInfo', () => {
    it('should call orderService.updateOrderInfo with correct parameters', async () => {
      const id = 'orderId';
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
        id: 'userId',
        role: 'STUDENT',
        email: 'test@example.com',
      };
      mockOrderService.updateOrderInfo.mockResolvedValue('updatedOrder');

      const result = await ordersController.updateInfo(id, updateOrderDto as CreateOrderDto, user);

      expect(orderService.updateOrderInfo).toHaveBeenCalledWith(id, updateOrderDto, user);
      expect(result).toBe('updatedOrder');
    });
  });

  describe('updateStatus', () => {
    it('should call orderService.updateStatus with correct parameters', async () => {
      const id = 'orderId';
      const updateStatusDto: UpdateStatusDto = {
        status: 'ACCEPTED',
        reason: 'some reason',
      };
      const user: GetUserType = {
        id: 'userId',
        role: 'ADMIN',
        email: 'test@example.com',
      };
      mockOrderService.updateStatus.mockResolvedValue('updatedStatus');

      const result = await ordersController.updateStatus(id, updateStatusDto, user);

      expect(orderService.updateStatus).toHaveBeenCalledWith(id, updateStatusDto, user);
      expect(result).toBe('updatedStatus');
    });
  });

  describe('remove', () => {
    it('should call orderService.deleteOrder with correct parameters', async () => {
      const id = 'orderId';
      const user: GetUserType = {
        id: 'userId',
        role: 'STUDENT',
        email: 'test@example.com',
      };
      mockOrderService.deleteOrder.mockResolvedValue('deletedOrder');

      const result = await ordersController.remove(id, user);

      expect(orderService.deleteOrder).toHaveBeenCalledWith(id, user);
      expect(result).toBe('deletedOrder');
    });
  });
});
