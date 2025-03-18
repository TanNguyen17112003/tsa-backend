import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerMiddleware } from 'src/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary';
import { DateModule } from './date/date.module';
import { DeliveriesModule } from './deliveries';
import { EmailModule } from './email';
import { GeolocationModule } from './geolocation';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentModule } from './payment/payment.module';
import { PrismaModule } from './prisma/prisma.module';
import { RecognitionModule } from './recognition/recognition.module';
import { ReportsModule } from './reports';
import { TicketsModule } from './tickets';
import { UsersModule } from './users';

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
    TicketsModule,
    RecognitionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
