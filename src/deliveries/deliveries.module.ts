import { Module } from '@nestjs/common';
import { NotificationsModule } from 'src/notifications/notifications.module';

import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';

@Module({
  imports: [NotificationsModule],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
})
export class DeliveriesModule {}
