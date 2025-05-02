import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import axios from 'axios';
import { DateService } from 'src/date';
import { EmailService } from 'src/email';
import { PrismaService } from 'src/prisma';
import { GetUserType } from 'src/types';

import { CheckPushNotificationDto } from './dto/check-pushNoti.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RegisterPushNotificationDto } from './dto/register-pushNoti.dto';
import { UnregisterPushNotificationDto } from './dto/unregister-pushNoti.dto';
import { NotificationsService } from './notifications.service';

jest.mock('google-auth-library', () => ({
  JWT: jest.fn(() => ({
    authorize: jest.fn(),
  })),
}));
jest.mock('axios', () => ({
  post: jest.fn(),
}));

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;
  let dateService: DateService;
  let emailService: EmailService;

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    deviceToken: {
      findMany: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const mockDateService = {
    mockCreatedAt: '1234567890',
    getCurrentUnixTimestamp: jest.fn(() => 1234567890),
  };
  const mockEmailService = {
    sendNotificationEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: DateService,
          useValue: mockDateService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
    dateService = module.get<DateService>(DateService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendNotification', () => {
    it('should create a notification and send an email', async () => {
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
        createdAt: mockDateService.mockCreatedAt,
        isRead: false,
      };
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      } as User;

      mockPrismaService.notification.create.mockResolvedValue(newNotification);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.sendNotification(dto);

      expect(result).toEqual(newNotification);
      expect(prisma.notification.create).toHaveBeenCalledTimes(1);
      expect(dateService.getCurrentUnixTimestamp).toHaveBeenCalled();
      expect(emailService.sendNotificationEmail).toHaveBeenCalledWith(
        mockUser,
        dto.title,
        dto.content
      );
    });
  });

  describe('getNotifications', () => {
    it('should return notifications and unread count', async () => {
      const user: GetUserType = {
        id: '1',
        email: 'test@example.com',
        role: 'STUDENT',
      };
      const notifications = [
        { id: '1', content: 'Test notification' },
        { id: '2', content: 'Another notification' },
      ];
      const unreadCount = 5;

      mockPrismaService.notification.findMany.mockResolvedValue(notifications);
      mockPrismaService.notification.count.mockResolvedValue(unreadCount);

      const result = await service.getNotifications(user);

      expect(result).toEqual({ notifications, unreadCount });
      expect(prisma.notification.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.notification.count).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateNotificationStatus', () => {
    it('should update notification status to read', async () => {
      const id = '1';
      const user: GetUserType = {
        id: '1',
        email: 'test@example.com',
        role: 'STUDENT',
      };
      const notification = { id, userId: user.id, isRead: false };

      mockPrismaService.notification.findUnique.mockResolvedValue(notification);
      mockPrismaService.notification.update.mockResolvedValue({
        ...notification,
        isRead: true,
      });

      const result = await service.updateNotificationStatus(id, user);

      expect(result).toEqual({ ...notification, isRead: true });
      expect(prisma.notification.findUnique).toHaveBeenCalled();
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id },
        data: { isRead: true },
      });
    });

    it('should throw an error if notification not found', async () => {
      const id = '1';
      const user: GetUserType = {
        id: '1',
        email: 'test@example.com',
        role: 'STUDENT',
      };

      mockPrismaService.notification.findUnique.mockResolvedValue(null);

      await expect(service.updateNotificationStatus(id, user)).rejects.toThrow(
        'Không tìm thấy thông báo'
      );
    });

    it('should throw an error if user does not have permission', async () => {
      const id = '1';
      const user: GetUserType = {
        id: '1',
        email: 'test@example.com',
        role: 'STUDENT',
      };
      const notification = { id, userId: '2', isRead: false };

      mockPrismaService.notification.findUnique.mockResolvedValue(notification);

      await expect(service.updateNotificationStatus(id, user)).rejects.toThrow(
        'Bạn không có quyền thay đổi trạng thái thông báo này'
      );
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      const user: GetUserType = {
        id: '1',
        email: 'test@example.com',
        role: 'STUDENT',
      };

      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllNotificationsAsRead(user);

      expect(result).toEqual({ count: 5 });
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: user.id },
        data: { isRead: true },
      });
    });
  });

  describe('sendPushNotification', () => {
    it('should send push notifications to all enabled devices', async () => {
      const userId = '1';
      const message = {
        title: 'Test Notification',
        message: 'This is a test push notification',
      };
      const foundDevices = [
        { token: 'deviceToken1', pushNotiType: 'ENABLED', platform: 'ANDROID' },
        { token: 'deviceToken2', pushNotiType: 'ENABLED', platform: 'ANDROID' },
      ];

      mockPrismaService.deviceToken.findMany.mockResolvedValue(foundDevices);
      jest.spyOn(service, 'getAccessTokenAsync').mockResolvedValue('mockAccessToken');

      await service.sendPushNotification({ userId, message });

      expect(prisma.deviceToken.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          pushNotiType: 'ENABLED',
          platform: 'ANDROID',
        },
      });
      expect(service.getAccessTokenAsync).toHaveBeenCalled();
      expect(axios.post).toHaveBeenCalledTimes(foundDevices.length);
    });

    it('should disable device token if notification sending fails', async () => {
      const userId = '1';
      const message = {
        title: 'Test Notification',
        message: 'This is a test push notification',
      };
      const foundDevices = [
        { token: 'deviceToken1', pushNotiType: 'ENABLED', platform: 'ANDROID' },
      ];

      mockPrismaService.deviceToken.findMany.mockResolvedValue(foundDevices);
      jest.spyOn(service, 'getAccessTokenAsync').mockResolvedValue('mockAccessToken');
      jest.spyOn(axios, 'post').mockRejectedValue(new Error('Failed to send notification'));
      mockPrismaService.deviceToken.update.mockResolvedValue({});

      await service.sendPushNotification({ userId, message });

      expect(prisma.deviceToken.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          pushNotiType: 'ENABLED',
          platform: 'ANDROID',
        },
      });
      expect(service.getAccessTokenAsync).toHaveBeenCalled();
      expect(axios.post).toHaveBeenCalledTimes(foundDevices.length);
      expect(prisma.deviceToken.update).toHaveBeenCalledWith({
        where: {
          userId: userId,
          token: foundDevices[0].token,
        },
        data: {
          pushNotiType: 'DISABLED',
        },
      });
    });

    it('should return early if no enabled devices are found', async () => {
      const userId = '1';
      const message = {
        title: 'Test Notification',
        message: 'This is a test push notification',
      };

      mockPrismaService.deviceToken.findMany.mockResolvedValue([]);
      jest.spyOn(service, 'getAccessTokenAsync');

      await service.sendPushNotification({ userId, message });

      expect(prisma.deviceToken.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          pushNotiType: 'ENABLED',
          platform: 'ANDROID',
        },
      });
      expect(service.getAccessTokenAsync).not.toHaveBeenCalled();
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe('registerPushNotification', () => {
    it('should enable push notifications for an existing device token', async () => {
      const registerPushNotificationDto: RegisterPushNotificationDto = {
        userId: '1',
        token: 'deviceToken1',
        platform: 'ANDROID',
      };

      mockPrismaService.deviceToken.upsert.mockResolvedValue({
        userId: '1',
        token: 'deviceToken1',
        platform: 'ANDROID',
        pushNotiType: 'ENABLED',
        createdAt: mockDateService.mockCreatedAt,
      });

      await service.registerPushNotification(registerPushNotificationDto);

      expect(prisma.deviceToken.upsert).toHaveBeenCalled();
    });

    it('should create a new device token if it does not exist', async () => {
      const registerPushNotificationDto: RegisterPushNotificationDto = {
        userId: '2',
        token: 'newDeviceToken',
        platform: 'IOS',
      };

      mockPrismaService.deviceToken.upsert.mockResolvedValue({
        userId: '2',
        token: 'newDeviceToken',
        platform: 'IOS',
        pushNotiType: 'ENABLED',
        createdAt: mockDateService.mockCreatedAt,
      });

      await service.registerPushNotification(registerPushNotificationDto);

      expect(prisma.deviceToken.upsert).toHaveBeenCalled();
    });
  });

  describe('unregisterPushNotification', () => {
    it('should update the push notification type for a given device token', async () => {
      const unregisterPushNotificationDto: UnregisterPushNotificationDto = {
        userId: '1',
        token: 'deviceToken1',
        type: 'DISABLED',
      };

      mockPrismaService.deviceToken.update.mockResolvedValue({
        userId: '1',
        token: 'deviceToken1',
        pushNotiType: 'DISABLED',
      });

      await service.unregisterPushNotification(unregisterPushNotificationDto);

      expect(prisma.deviceToken.update).toHaveBeenCalled();
    });

    it('should throw an error if the device token update fails', async () => {
      const unregisterPushNotificationDto: UnregisterPushNotificationDto = {
        userId: '1',
        token: 'invalidToken',
        type: 'DISABLED',
      };

      mockPrismaService.deviceToken.update.mockRejectedValue(new Error('Update failed'));

      await expect(
        service.unregisterPushNotification(unregisterPushNotificationDto)
      ).rejects.toThrow('Update failed');

      expect(prisma.deviceToken.update).toHaveBeenCalled();
    });
  });

  describe('checkPushNotification', () => {
    it('should return the push notification type if the device token exists', async () => {
      const checkPushNotificationDto: CheckPushNotificationDto = {
        userId: '1',
        token: 'deviceToken1',
      };

      const foundDevice = {
        userId: '1',
        token: 'deviceToken1',
        pushNotiType: 'ENABLED',
      };

      mockPrismaService.deviceToken.findFirst.mockResolvedValue(foundDevice);

      const result = await service.checkPushNotification(checkPushNotificationDto);

      expect(result).toEqual({ pusNotiType: 'ENABLED' });
      expect(prisma.deviceToken.findFirst).toHaveBeenCalledWith({
        where: {
          userId: checkPushNotificationDto.userId,
          token: checkPushNotificationDto.token,
        },
      });
    });

    it('should return null if the device token does not exist', async () => {
      const checkPushNotificationDto: CheckPushNotificationDto = {
        userId: '1',
        token: 'nonExistentToken',
      };

      mockPrismaService.deviceToken.findFirst.mockResolvedValue(null);

      const result = await service.checkPushNotification(checkPushNotificationDto);

      expect(result).toEqual({ pusNotiType: null });
      expect(prisma.deviceToken.findFirst).toHaveBeenCalledWith({
        where: {
          userId: checkPushNotificationDto.userId,
          token: checkPushNotificationDto.token,
        },
      });
    });
  });
});
