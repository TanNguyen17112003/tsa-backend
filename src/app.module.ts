import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth';
import { DateModule } from 'src/date';
import { EmailModule } from 'src/email';
import { OrdersController } from 'src/models/orders/orders.controller';
import { ReportsController } from 'src/models/reports/reports.controller';
import { PrismaModule } from 'src/prisma';
import { UsersModule } from 'src/users';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    DateModule,
    EmailModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController, OrdersController, ReportsController],
  providers: [AppService],
})
export class AppModule {}
