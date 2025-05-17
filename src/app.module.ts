import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerMiddleware } from 'src/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary';
import { DateModule } from './date/date.module';
import { DeliveriesModule } from './deliveries';
import { EmailModule } from './email';
import { FirebaseModule } from './firebase';
import { GeolocationModule } from './geolocation';
import { IdGeneratorModule } from './id-generator';
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
    BullModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          username: configService.get<string>('REDIS_USERNAME'),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    DateModule,
    EmailModule,
    FirebaseModule,
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
    IdGeneratorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
