import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryStatus, UserRole } from '@prisma/client';

import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';

describe('DeliveriesController', () => {
  let controller: DeliveriesController;
  let service: DeliveriesService;

  const mockDeliveriesService = {
    createDelivery: jest.fn(),
    getDeliveries: jest.fn(),
    getDelivery: jest.fn(),
    updateDelivery: jest.fn(),
    updateDeliveryStatus: jest.fn(),
    deleteDelivery: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveriesController],
      providers: [
        {
          provide: DeliveriesService,
          useValue: mockDeliveriesService,
        },
      ],
    }).compile();

    controller = module.get<DeliveriesController>(DeliveriesController);
    service = module.get<DeliveriesService>(DeliveriesService);
  });

  describe('createDelivery', () => {
    it('should call service.createDelivery', async () => {
      const dto = { orderIds: ['order1'] };
      mockDeliveriesService.createDelivery.mockResolvedValue('result');

      expect(await controller.createDelivery(dto as any)).toEqual('result');
      expect(service.createDelivery).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAllDeliveries', () => {
    it('should call service.getDeliveries', async () => {
      const user = { id: 'user1', role: UserRole.STAFF, email: 'test-email@example.com' };
      mockDeliveriesService.getDeliveries.mockResolvedValue('deliveries');

      expect(await controller.findAllDeliveries(user)).toEqual('deliveries');
      expect(service.getDeliveries).toHaveBeenCalledWith(user);
    });
  });

  describe('findOneDelivery', () => {
    it('should call service.getDelivery', async () => {
      mockDeliveriesService.getDelivery.mockResolvedValue('delivery');
      expect(await controller.findOneDelivery('id')).toEqual('delivery');
      expect(service.getDelivery).toHaveBeenCalledWith('id');
    });
  });

  describe('updateInfo', () => {
    it('should call service.updateDelivery', async () => {
      const dto = { orderIds: ['order1'] };
      mockDeliveriesService.updateDelivery.mockResolvedValue('updated');
      expect(await controller.updateInfo('id', dto as any)).toEqual('updated');
      expect(service.updateDelivery).toHaveBeenCalledWith('id', dto);
    });
  });

  describe('updateStatus', () => {
    it('should call service.updateDeliveryStatus', async () => {
      const dto = { status: DeliveryStatus.ACCEPTED };
      const user = { id: 'staffId', role: UserRole.STAFF, email: 'text@example.com' };
      mockDeliveriesService.updateDeliveryStatus.mockResolvedValue('status updated');
      expect(await controller.updateStatus('id', dto as any, user)).toEqual('status updated');
      expect(service.updateDeliveryStatus).toHaveBeenCalledWith('id', dto, user);
    });
  });

  describe('remove', () => {
    it('should call service.deleteDelivery', async () => {
      mockDeliveriesService.deleteDelivery.mockResolvedValue('deleted');
      expect(await controller.remove('id')).toEqual('deleted');
      expect(service.deleteDelivery).toHaveBeenCalledWith('id');
    });
  });
});
