import { Module } from '@nestjs/common';

import { OrdersController } from '../../controllers/orders.controller';

@Module({
  controllers: [OrdersController],
})
export class OrdersModule {}
