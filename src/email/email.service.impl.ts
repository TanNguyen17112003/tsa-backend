import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { Queue } from 'bullmq';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { EMAIL_QUEUE_NAME } from './email.constant';
import { EmailService } from './email.service';

@Injectable()
export class EmailServiceImpl extends EmailService {
  private readonly fromEmail: string;
  private readonly transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectQueue(EMAIL_QUEUE_NAME) private readonly emailQueue: Queue,
    configService: ConfigService
  ) {
    super();
    this.fromEmail = configService.get<string>('SMTP_GMAIL');
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: configService.get<string>('SMTP_HOST'),
      port: configService.get<number>('SMTP_PORT'),
      auth: {
        user: this.fromEmail,
        pass: configService.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  override async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: `TSA <${this.fromEmail}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to} with subject: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }

  override async sendVerificationEmail(to: string, verificationLink: string) {
    await this.emailQueue.add('sendVerificationEmail', {
      to,
      subject: 'Xác nhận tài khoản của bạn',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #4CAF50;">Xác nhận tài khoản của bạn</h2>
          <p>Cảm ơn bạn đã đăng ký dịch vụ của chúng tôi!</p>
          <p>Vui lòng xác nhận địa chỉ email của bạn bằng cách nhấp vào liên kết bên dưới:</p>
          <a href="${verificationLink}" style="display: inline-block; margin: 10px 0; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Xác nhận Email</a>
          <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
          <p>Trân trọng,</p>
          <p style="font-weight: bold;">TSA Team</p>
        </div>
      `,
    });
  }

  override async sendNotificationEmail(toUser: User, subject: string, content: string) {
    await this.emailQueue.add('sendNotificationEmail', {
      to: toUser.email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px;">Xin chào ${toUser.lastName} ${toUser.firstName}</h2>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="font-size: 16px;">${content}</p>
          </div>
          <p>Mọi thắc mắc xin vui lòng liên hệ qua <a href="mailto:${this.fromEmail}" style="color: #3498db; text-decoration: none;">${this.fromEmail}</a></p>
          <p>Xin kính chúc sức khỏe và may mắn!</p>
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
            <p style="color: #3498db; font-weight: bold; margin: 0;">TSA_ADMIN</p>
          </div>
        </div>
      `,
    });
  }
}
