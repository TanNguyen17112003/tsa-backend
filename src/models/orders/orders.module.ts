import { Module } from '@nestjs/common';

import { OrdersController } from './orders.controller';
import { OrderService } from './orders.service';

@Module({
  controllers: [OrdersController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrdersModule {}
