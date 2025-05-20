import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';

import { EMAIL_QUEUE_NAME } from './email.constant';
import { EmailServiceImpl } from './email.service.impl';

const mockTransporter = {
  sendMail: jest.fn(),
};

const mockQueue = {
  add: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key) => {
    if (key === 'SMTP_GMAIL') return 'test@example.com';
    if (key === 'SMTP_HOST') return 'smtp.example.com';
    if (key === 'SMTP_PORT') return 587;
    if (key === 'SMTP_PASSWORD') return 'password';
    return null;
  }),
};

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter),
}));

describe('EmailServiceImpl', () => {
  let service: EmailServiceImpl;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailServiceImpl,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getQueueToken(EMAIL_QUEUE_NAME),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<EmailServiceImpl>(EmailServiceImpl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    const to = 'recipient@example.com';
    const subject = 'Test Subject';
    const html = '<p>Test Content</p>';

    it('should send an email with the correct details', async () => {
      await service.sendEmail(to, subject, html);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'TSA <test@example.com>',
        to,
        subject,
        html,
      });
    });

    it('should throw an error if sending email fails', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('Failed to send email'));

      await expect(service.sendEmail(to, subject, html)).rejects.toThrow('Failed to send email');
    });
  });

  describe('sendVerificationEmail', () => {
    const to = 'test@example.com';
    const verificationLink = 'http://example.com/verify';

    it('should add verification email job to queue with correct details', async () => {
      await service.sendVerificationEmail(to, verificationLink);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'sendVerificationEmail',
        expect.objectContaining({
          to,
          subject: 'Xác nhận tài khoản của bạn',
          html: expect.stringContaining(verificationLink),
        })
      );
    });
  });

  describe('sendNotificationEmail', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      password: 'hashedpassword',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '1234567890',
      photoUrl: 'http://example.com/photo.jpg',
      role: 'STAFF',
      createdAt: new Date(),
      verified: true,
      status: 'AVAILABLE',
    };
    const subject = 'Test Subject';
    const content = 'Test Content';

    it('should add notification email job to queue with correct details', async () => {
      await service.sendNotificationEmail(mockUser, subject, content);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'sendNotificationEmail',
        expect.objectContaining({
          to: mockUser.email,
          subject,
          html: expect.stringContaining(content),
        })
      );
    });
  });
});
