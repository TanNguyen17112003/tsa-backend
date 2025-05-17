import { Module } from '@nestjs/common';
import { NotificationsModule } from 'src/notifications';

import { PaymentController } from './payment.controller';
import { PaymentGateway } from './payment.gateway';
import { PaymentService } from './payment.service';

@Module({
  imports: [NotificationsModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentGateway],
  exports: [PaymentService],
})
export class PaymentModule {}
