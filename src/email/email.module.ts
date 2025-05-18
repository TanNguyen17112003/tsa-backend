import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';

import { EMAIL_QUEUE_NAME } from './email.constant';
import { EmailProcessor } from './email.processor';
import { EmailService } from './email.service';
import { EmailServiceImpl } from './email.service.impl';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: EMAIL_QUEUE_NAME,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
  ],
  providers: [
    {
      provide: EmailService,
      useClass: EmailServiceImpl,
    },
    EmailProcessor,
  ],
  exports: [EmailService],
})
export class EmailModule {}
