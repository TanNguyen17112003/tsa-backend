import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

  constructor() {
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

  async sendVerificationEmail(to: string, verificationLink: string) {
    await this.transporter.sendMail({
      from: `TSA <${process.env.SMTP_GMAIL}>`,
      to,
      subject: 'Xác nhận tài khoản của bạn',
      html: `
        <p>Cảm ơn bạn đã đăng ký dịch vụ của chúng tôi! Vui lòng xác nhận địa chỉ email của bạn bằng cách nhấp vào liên kết bên dưới:</p>
        <p>${verificationLink}</p>
      `,
    });
  }

  async sendNotificationEmail(toUser: User, subject: string, content: string) {
    await this.transporter.sendMail({
      from: `TSA <${process.env.SMTP_GMAIL}>`,
      to: toUser.email,
      subject,
      html: `
        <div>
          <h2>Xin chào ${toUser.lastName} ${toUser.firstName}</h2>
          <p>${content}!</p>
          <p>Mọi thắc mắc xin vui lòng liên hệ qua <a href=${process.env.SMTP_GMAIL}>${process.env.SMTP_GMAIL}</a></p>
          <p>Xin kính chức sức khỏe và may mắn!</p>
          <p style="color:blue;font-weight:bold">TSA_ADMIN</p>
        </div>
      `,
    });
  }
}
