import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { JWT } from 'google-auth-library';
import { DateService } from 'src/date';
import { EmailService } from 'src/email';
import { PrismaService } from 'src/prisma';
import { GetUserType } from 'src/types';

import { CheckPushNotificationDto } from './dto/check-pushNoti.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RegisterPushNotificationDto } from './dto/register-pushNoti.dto';
import { UnregisterPushNotificationDto } from './dto/unregister-pushNoti.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dateService: DateService,
    private readonly emailService: EmailService
  ) {}

  async sendNotification(createNotificationDto: CreateNotificationDto) {
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

  async getNotifications(user: GetUserType) {
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

  async updateNotificationStatus(id: string, user: GetUserType) {
    const notification = await this.prisma.notification.findUnique({
      where: {
        id,
      },
    });
    if (!notification) {
      throw new Error('Không tìm thấy thông báo');
    }
    if (notification.userId !== user.id) {
      throw new Error('Bạn không có quyền thay đổi trạng thái thông báo này');
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

  async markAllNotificationsAsRead(user: GetUserType) {
    return this.prisma.notification.updateMany({
      where: {
        userId: user.id,
      },
      data: {
        isRead: true,
      },
    });
  }

  getAccessTokenAsync(key: FCMKey) {
    console.log(key);
    return new Promise(function (resolve, reject) {
      const jwtClient = new JWT(
        key.client_email,
        null,
        key.private_key,
        ['https://www.googleapis.com/auth/cloud-platform'],
        null
      );
      jwtClient.authorize(function (err, tokens) {
        if (err) {
          reject(err);
          return;
        }
        resolve(tokens.access_token);
      });
    });
  }
  async sendPushNotification({
    userId,
    message,
  }: {
    userId: string;
    message: PushNotificationMessage;
  }) {
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

    const key: FCMKey = {
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.PUSH_NOTI_PRIVATE_KEY,
    };
    const expoInfo = `${process.env.EXPO_USERNAME}/${process.env.EXPO_SLUG}`;
    // Get the access token
    const firebaseAccessToken = await this.getAccessTokenAsync(key);
    // Send notification to each device token concurrently
    const notificationPromises = foundDevices.map((device) =>
      axios.post(
        `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:send`,
        {
          message: {
            token: device.token,
            data: {
              ...message,
              channelId: 'default',
              scopeKey: expoInfo,
              experienceId: expoInfo,
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${firebaseAccessToken}`,
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
        }
      )
    );

    const notificationResults = await Promise.allSettled(notificationPromises);
    notificationResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Notification sent to ${foundDevices[index].token}`);
      } else {
        console.log(`Failed to send notification to ${foundDevices[index].token}`);
        this.prisma.deviceToken.update({
          where: {
            userId: userId,
            token: foundDevices[index].token,
          },
          data: {
            pushNotiType: 'DISABLED',
          },
        });
      }
    });
  }
  async registerPushNotification(registerPushNotificationDto: RegisterPushNotificationDto) {
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

  async unregisterPushNotification(unregisterPushNotificationDto: UnregisterPushNotificationDto) {
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

  async checkPushNotification(checkPushNotification: CheckPushNotificationDto) {
    const { userId, token } = checkPushNotification;
    const foundDevices = await this.prisma.deviceToken.findFirst({
      where: {
        userId,
        token,
      },
    });
    // await this.sendPushNotification({
    //   userId,
    //   message: {
    //     title: 'Chào mừng bạn đến với TSA',
    //     message:
    //       'Cảm ơn bạn đã đăng ký nhận thông báo từ TSA. Bạn sẽ nhận được thông báo khi có thông tin mới từ TSA.',
    //   },
    // });
    return {
      pusNotiType: foundDevices?.pushNotiType || null,
    };
  }
}
