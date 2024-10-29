import { Module } from '@nestjs/common';
import { NotificationsModule } from 'src/notifications/notifications.module';

import { OrdersController } from './orders.controller';
import { OrderService } from './orders.service';

@Module({
  imports: [NotificationsModule],
  controllers: [OrdersController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrdersModule {}
