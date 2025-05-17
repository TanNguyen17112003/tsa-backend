import { Module } from '@nestjs/common';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { PythonApiModule } from 'src/python-api/python-api.module';

import { OrdersController } from './orders.controller';
import { OrderService } from './orders.service';
import { OrderServiceImpl } from './orders.service.impl';

@Module({
  imports: [NotificationsModule, PythonApiModule],
  controllers: [OrdersController],
  providers: [
    {
      provide: OrderService,
      useClass: OrderServiceImpl,
    },
  ],
  exports: [OrderService],
})
export class OrdersModule {}
