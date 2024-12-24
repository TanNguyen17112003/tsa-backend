import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PrismaService } from 'src/prisma';

import { PaymentController } from './payment.controller';
import { PaymentGateway } from './payment.gateway';
import { PaymentService } from './payment.service';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentController],
  providers: [PaymentService, PrismaService, NotificationsService, PaymentGateway],
  exports: [PaymentService],
})
export class PaymentModule {}
