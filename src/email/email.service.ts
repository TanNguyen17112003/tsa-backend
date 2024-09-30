import { Injectable } from '@nestjs/common';
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
      subject: 'Please verify your email',
      html: `
        <p>Thank you for signing up to our service! Please verify your email address by clicking the link below:</p>
        <p>${verificationLink}</p>
      `,
    });
  }
}
