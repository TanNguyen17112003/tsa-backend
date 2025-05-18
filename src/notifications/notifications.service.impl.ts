import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeviceToken, Notification, Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { DateService } from 'src/date';
import { EmailService } from 'src/email';
import { FirebaseService } from 'src/firebase';
import { PrismaService } from 'src/prisma';
import { GetUserType } from 'src/types';

import { CheckPushNotificationDto } from './dto/check-pushNoti.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { GetNotificationsDto } from './dto/get-notification.dto';
import { RegisterPushNotificationDto } from './dto/register-pushNoti.dto';
import { UnregisterPushNotificationDto } from './dto/unregister-pushNoti.dto';
import { PUSH_NOTIFICATIONS_QUEUE_NAME } from './notifications.constant';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsServiceImpl extends NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expoInfo: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly dateService: DateService,
    private readonly emailService: EmailService,
    private readonly firebaseService: FirebaseService,
    private readonly configService: ConfigService,
    @InjectQueue(PUSH_NOTIFICATIONS_QUEUE_NAME) private readonly pushNotificationQueue: Queue
  ) {
    super();
    this.expoInfo = `${configService.get('EXPO_USERNAME')}/${configService.get('EXPO_SLUG')}`;
  }

  override async sendNotification(
    createNotificationDto: CreateNotificationDto
  ): Promise<Notification> {
    const createdAt = this.dateService.getCurrentUnixTimestamp().toString();

    const newNotification = await this.prisma.notification.create({
      data: {
        ...createNotificationDto,
        createdAt,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: {
        id: createNotificationDto.userId,
      },
    });
    if (user) {
      await this.emailService.sendNotificationEmail(
        user,
        createNotificationDto.title,
        createNotificationDto.content
      );
    }
    return newNotification;
  }

  override async getNotifications(user: GetUserType): Promise<GetNotificationsDto> {
    const notifications = await this.prisma.notification.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      where: {
        userId: user.id,
      },
    });

    const unreadCount = await this.prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    return {
      notifications,
      unreadCount,
    };
  }

  override async updateNotificationStatus(id: string, user: GetUserType): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: {
        id,
        userId: user.id,
      },
    });
    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }
    return this.prisma.notification.update({
      where: {
        id,
      },
      data: {
        isRead: true,
      },
    });
  }

  override async markAllNotificationsAsRead(user: GetUserType): Promise<Prisma.BatchPayload> {
    return this.prisma.notification.updateMany({
      where: {
        userId: user.id,
      },
      data: {
        isRead: true,
      },
    });
  }

  // getAccessTokenAsync(key: FCMKey) {
  //   console.log(key);
  //   return new Promise(function (resolve, reject) {
  //     const jwtClient = new JWT(
  //       key.client_email,
  //       null,
  //       key.private_key,
  //       ['https://www.googleapis.com/auth/cloud-platform'],
  //       null
  //     );
  //     jwtClient.authorize(function (err, tokens) {
  //       if (err) {
  //         reject(err);
  //         return;
  //       }
  //       resolve(tokens.access_token);
  //     });
  //   });
  // }

  override async sendPushNotification(userId: string, message: PushNotificationMessage) {
    const foundDevices = await this.prisma.deviceToken.findMany({
      where: {
        userId,
        pushNotiType: 'ENABLED',
        platform: 'ANDROID',
      },
    });
    if (!foundDevices || !foundDevices.length) {
      return;
    }

    // Send notification to each device token
    foundDevices.forEach((device) => {
      this.addPushNotificationForDeviceToQueue(device, message);
    });
  }

  override async registerPushNotification(
    registerPushNotificationDto: RegisterPushNotificationDto
  ) {
    const { userId, token, platform } = registerPushNotificationDto;
    await this.prisma.deviceToken.upsert({
      where: {
        userId,
        token,
        platform,
      },
      update: {
        pushNotiType: 'ENABLED',
      },
      create: {
        userId,
        token,
        platform,
        pushNotiType: 'ENABLED',
        createdAt: this.dateService.getCurrentUnixTimestamp().toString(),
      },
    });
  }

  override async unregisterPushNotification(
    unregisterPushNotificationDto: UnregisterPushNotificationDto
  ) {
    const { userId, token, type } = unregisterPushNotificationDto;
    await this.prisma.deviceToken.update({
      where: {
        userId: userId,
        token: token,
      },
      data: {
        pushNotiType: type,
      },
    });
  }

  override async checkPushNotification(checkPushNotification: CheckPushNotificationDto) {
    const { userId, token } = checkPushNotification;
    const foundDevices = await this.prisma.deviceToken.findFirst({
      where: {
        userId,
        token,
      },
    });

    return {
      pusNotiType: foundDevices?.pushNotiType || null,
    };
  }

  override async sendFullNotification({
    userId,
    type,
    title,
    message,
    orderId,
    deliveryId,
    reportId,
  }: {
    userId: string;
    type: 'ORDER' | 'DELIVERY' | 'REPORT'; // mở rộng nếu cần
    title: string;
    message: string;
    orderId?: string;
    deliveryId?: string;
    reportId?: string;
  }) {
    await Promise.all([
      this.sendNotification({
        type,
        title,
        content: message,
        orderId,
        userId,
        deliveryId,
        reportId,
      }),
      this.sendPushNotification(userId, {
        title,
        message,
      }),
    ]);
  }

  async sendPushNotificationForDevice(
    deviceToken: string,
    message: PushNotificationMessage,
    _userId: string
  ) {
    try {
      await this.firebaseService.getMessaging().send({
        token: deviceToken,
        data: {
          ...message,
          channelId: 'default',
          scopeKey: this.expoInfo,
          experienceId: this.expoInfo,
        },
      });
      this.logger.log(`Push notification sent successfully to token: ${deviceToken}`);
    } catch (error) {
      this.logger.error(`Failed to send push notification to token: ${deviceToken}`, error);
      // Do not disable, as we can retry later
      // await this.prisma.deviceToken.update({
      //   where: {
      //     userId: userId,
      //     token: deviceToken,
      //   },
      //   data: {
      //     pushNotiType: 'DISABLED',
      //   },
      // });
      throw new Error(`Failed to send push notification: ${error}`);
    }
  }

  private async addPushNotificationForDeviceToQueue(
    device: DeviceToken,
    message: PushNotificationMessage
  ) {
    await this.pushNotificationQueue.add('sendPushNotification', {
      token: device.token,
      message,
      userId: device.userId,
    });
  }
}
