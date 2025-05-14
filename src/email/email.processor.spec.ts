import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { EmailJobData } from 'src/types/queue';

import { EmailProcessor } from './email.processor';
import { EmailService } from './email.service';

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let emailService: EmailService;

  const mockJob = {
    id: '123',
    name: 'test-job',
    data: {
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Test Content</p>',
    },
  } as Job<EmailJobData, any, string>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    processor = module.get<EmailProcessor>(EmailProcessor);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('process', () => {
    it('should process job and call emailService.sendEmail with correct parameters', async () => {
      await processor.process(mockJob);

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        mockJob.data.to,
        mockJob.data.subject,
        mockJob.data.html
      );
    });

    it('should log the job being processed', async () => {
      const logSpy = jest.spyOn((processor as any).logger, 'log');

      await processor.process(mockJob);

      expect(logSpy).toHaveBeenCalledWith(`Processing email job: ${mockJob.name} - ${mockJob.id}`);
    });

    it('should propagate errors from emailService', async () => {
      const testError = new Error('Email sending failed');
      jest.spyOn(emailService, 'sendEmail').mockRejectedValueOnce(testError);

      await expect(processor.process(mockJob)).rejects.toThrow(testError);
    });
  });
});
