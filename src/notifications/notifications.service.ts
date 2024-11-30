// src/notification/notification.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { JWT } from 'google-auth-library';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { DateService } from 'src/date';
import { PrismaService } from 'src/prisma';

import { CheckPushNotificationDto } from './dto/check-pushNoti.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RegisterPushNotificationDto } from './dto/register-pushNoti.dto';
import { UnregisterPushNotificationDto } from './dto/unregister-pushNoti.dto';

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
  constructor(
    private readonly prisma: PrismaService,
    private readonly dateService: DateService
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_GMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendNotification(createNotificationDto: CreateNotificationDto) {
    const createdAt = this.dateService.getCurrentUnixTimestamp().toString();

    const newNotification = await this.prisma.notification.create({
      data: {
        ...createNotificationDto,
        createdAt,
      },
    });

    const foundUser = await this.prisma.credentials.findUnique({
      where: {
        uid: createNotificationDto.userId,
      },
    });
    if (foundUser && foundUser.email) {
      const mailOptions = {
        from: `TSA <${process.env.SMTP_GMAIL}>`,
        to: foundUser.email,
        subject: createNotificationDto.title,
        html: `
          <p>${createNotificationDto.content}</p>
        `,
      };
      await this.transporter.sendMail(mailOptions);
    }
    return newNotification;
  }

  async getNotifications() {
    return this.prisma.notification.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateNotificationStatus(id: string) {
    return this.prisma.notification.update({
      where: {
        id,
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
        console.log(`Notification sent to ${foundDevices[index].token}:`, result.value.data);
      } else {
        console.error(
          `Failed to send notification to ${foundDevices[index].token}:`,
          result.reason
        );
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
