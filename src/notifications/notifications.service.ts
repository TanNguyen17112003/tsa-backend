// src/notification/notification.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { DateService } from 'src/date';
import { PrismaService } from 'src/prisma';

import { CreateNotificationDto } from './dto/create-notification.dto';

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
}
