import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PushNotificationJobData } from 'src/types/queue';

import { PUSH_NOTIFICATIONS_QUEUE_NAME } from './notifications.constant';
import { NotificationsService } from './notifications.service';

@Processor(PUSH_NOTIFICATIONS_QUEUE_NAME)
export class PushNotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(PushNotificationsProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<PushNotificationJobData, any, string>): Promise<any> {
    this.logger.log(`Processing push notification job: ${job.name} - ${job.id}`);

    const { token, message, userId } = job.data;
    await this.notificationsService.sendPushNotificationForDevice(token, message, userId);
  }
}
