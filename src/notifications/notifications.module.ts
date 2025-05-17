import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { FirebaseModule } from 'src/firebase';

import { PUSH_NOTIFICATIONS_QUEUE_NAME } from './notifications.constant';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsServiceImpl } from './notifications.service.impl';
import { PushNotificationsProcessor } from './push-notifications.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: PUSH_NOTIFICATIONS_QUEUE_NAME,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    }),
    FirebaseModule,
  ],
  controllers: [NotificationsController],
  providers: [
    {
      provide: NotificationsService,
      useClass: NotificationsServiceImpl,
    },
    PushNotificationsProcessor,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
