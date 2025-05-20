import { User } from '@prisma/client';

export abstract class EmailService {
  abstract sendEmail(to: string, subject: string, html: string): Promise<void>;
  abstract sendVerificationEmail(to: string, verificationLink: string): Promise<void>;
  abstract sendNotificationEmail(toUser: User, subject: string, content: string): Promise<void>;
}
