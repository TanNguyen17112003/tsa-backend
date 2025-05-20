import { Module } from '@nestjs/common';
import { NotificationsModule } from 'src/notifications';

import { PaymentController } from './payment.controller';
import { PaymentGateway } from './payment.gateway';
import { PaymentService } from './payment.service';
import { PaymentServiceImpl } from './payment.service.impl';

@Module({
  imports: [NotificationsModule],
  controllers: [PaymentController],
  providers: [
    {
      provide: PaymentService,
      useClass: PaymentServiceImpl,
    },
    PaymentGateway,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
