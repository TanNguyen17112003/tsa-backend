import { Module } from '@nestjs/common';
import { NotificationsModule } from 'src/notifications/notifications.module';

import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesServiceImpl } from './deliveries.service.impl';

@Module({
  imports: [NotificationsModule],
  controllers: [DeliveriesController],
  providers: [
    {
      provide: DeliveriesService,
      useClass: DeliveriesServiceImpl,
    },
  ],
})
export class DeliveriesModule {}
