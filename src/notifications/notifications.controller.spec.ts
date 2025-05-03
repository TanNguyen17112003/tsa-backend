import { Test, TestingModule } from '@nestjs/testing';
import { GetUserType } from 'src/types';

import { CheckPushNotificationDto } from './dto/check-pushNoti.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RegisterPushNotificationDto } from './dto/register-pushNoti.dto';
import { UnregisterPushNotificationDto } from './dto/unregister-pushNoti.dto';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: {
            sendNotification: jest.fn(),
            getNotifications: jest.fn(),
            markAllNotificationsAsRead: jest.fn(),
            updateNotificationStatus: jest.fn(),
            registerPushNotification: jest.fn(),
            unregisterPushNotification: jest.fn(),
            checkPushNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('sendNotification', () => {
    it('should send a notification', async () => {
      const dto: CreateNotificationDto = {
        type: 'ORDER',
        title: 'Test',
        content: 'Test content',
        userId: '1',
        orderId: '123',
        deliveryId: null,
        reportId: null,
      };
      const newNotification = {
        id: '1',
        ...dto,
        createdAt: '123456789',
        isRead: false,
      };
      jest.spyOn(service, 'sendNotification').mockResolvedValue(newNotification);

      const result = await controller.sendNotification(dto);

      expect(result).toBe(newNotification);
      expect(service.sendNotification).toHaveBeenCalledWith(dto);
    });
  });

  describe('getNotifications', () => {
    it('should get notifications', async () => {
      const user: GetUserType = {
        id: 'user1',
        email: 'test@example.com',
        role: 'STUDENT',
      };
      const notifications = [
        { id: '1', content: 'Test notification' },
        { id: '2', content: 'Another notification' },
      ];
      jest.spyOn(service, 'getNotifications').mockResolvedValue(notifications as any);

      const result = await controller.getNotifications(user);

      expect(result).toEqual(notifications);
      expect(service.getNotifications).toHaveBeenCalledWith(user);
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read', async () => {
      const user: GetUserType = {
        id: 'user1',
        email: 'test@example.com',
        role: 'STUDENT',
      };
      jest.spyOn(service, 'markAllNotificationsAsRead').mockResolvedValue({ count: 5 });

      const result = await controller.markAllNotificationsAsRead(user);

      expect(result).toEqual({ count: 5 });
      expect(service.markAllNotificationsAsRead).toHaveBeenCalledWith(user);
    });
  });

  describe('updateNotificationStatus', () => {
    it('should update notification status', async () => {
      const user: GetUserType = {
        id: 'user1',
        email: 'test@example.com',
        role: 'STUDENT',
      };
      const id = 'notification1';
      const notification = { id, userId: user.id, isRead: true };
      jest.spyOn(service, 'updateNotificationStatus').mockResolvedValue(notification as any);

      const result = await controller.updateNotificationStatus(id, user);

      expect(result).toEqual(notification);
      expect(service.updateNotificationStatus).toHaveBeenCalledWith(id, user);
    });
  });

  describe('registerPushNotification', () => {
    it('should register push notification', async () => {
      const dto: RegisterPushNotificationDto = {
        userId: 'user1',
        token: 'pushToken',
        platform: 'ANDROID',
      };
      jest.spyOn(service, 'registerPushNotification').mockResolvedValue('Push registered' as any);

      const result = await controller.registerPushNotification(dto);

      expect(result).toBe('Push registered');
      expect(service.registerPushNotification).toHaveBeenCalledWith(dto);
    });
  });

  describe('unregisterPushNotification', () => {
    it('should unregister push notification', async () => {
      const dto: UnregisterPushNotificationDto = {
        token: 'pushToken',
        userId: 'user1',
        type: 'DISABLED',
      };
      jest
        .spyOn(service, 'unregisterPushNotification')
        .mockResolvedValue('Push unregistered' as any);

      const result = await controller.unregisterPushNotification(dto);

      expect(result).toBe('Push unregistered');
      expect(service.unregisterPushNotification).toHaveBeenCalledWith(dto);
    });
  });
  describe('checkPushNotification', () => {
    it('should check push notification', async () => {
      const dto: CheckPushNotificationDto = {
        token: 'pushToken',
        userId: 'user1',
      };
      jest.spyOn(service, 'checkPushNotification').mockResolvedValue('Push valid' as any);

      const result = await controller.checkPushNotification(dto);

      expect(result).toBe('Push valid');
      expect(service.checkPushNotification).toHaveBeenCalledWith(dto);
    });
  });
});
