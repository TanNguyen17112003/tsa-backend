import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailJobData } from 'src/types/queue';

import { EMAIL_QUEUE_NAME } from './email.constant';
import { EmailService } from './email.service';

@Processor(EMAIL_QUEUE_NAME)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<EmailJobData, any, string>): Promise<any> {
    this.logger.log(`Processing email job: ${job.name} - ${job.id}`);

    const { to, subject, html } = job.data;
    await this.emailService.sendEmail(to, subject, html);
  }
}
