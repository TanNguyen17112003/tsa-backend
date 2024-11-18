import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { DateModule } from './date/date.module';
import { DeliveriesModule } from './deliveries';
import { EmailModule } from './email/email.module';
import { FirebaseAdminConfigService } from './firebase-admin.config';
import { GeolocationModule } from './geolocation';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentModule } from './payment/payment.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    DateModule,
    EmailModule,
    AuthModule,
    UsersModule,
    OrdersModule,
    CloudinaryModule,
    ReportsModule,
    DeliveriesModule,
    PaymentModule,
    NotificationsModule,
    GeolocationModule,
  ],
  controllers: [AppController],
  providers: [AppService, FirebaseAdminConfigService],
})
export class AppModule {}
