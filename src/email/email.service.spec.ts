import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';

import { EmailService } from './email.service';

const mockTransporter = {
  sendMail: jest.fn(),
};

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter),
}));

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendVerificationEmail', () => {
    const to = 'test@example.com';
    const verificationLink = 'http://example.com/verify';

    it('should send a verification email with the correct details', async () => {
      await service.sendVerificationEmail(to, verificationLink);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should throw an error if sending email fails', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('Failed to send email'));

      await expect(service.sendVerificationEmail(to, verificationLink)).rejects.toThrow(
        'Failed to send email'
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

    it('should send a notification email with the correct details', async () => {
      await service.sendNotificationEmail(mockUser, subject, content);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should throw an error if sending email fails', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('Failed to send email'));

      await expect(service.sendNotificationEmail(mockUser, subject, content)).rejects.toThrow(
        'Failed to send email'
      );
    });
  });
});
