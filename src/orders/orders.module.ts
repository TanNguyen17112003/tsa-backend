import { Module } from '@nestjs/common';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { PythonApiModule } from 'src/python-api/python-api.module';

import { OrdersController } from './orders.controller';
import { OrderService } from './orders.service';

@Module({
  imports: [NotificationsModule, PythonApiModule],
  controllers: [OrdersController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrdersModule {}
