import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth';
import { DateModule } from 'src/date';
import { EmailModule } from 'src/email';
import { OrdersModule } from 'src/orders';
import { PrismaModule } from 'src/prisma';
import { ReportsModule } from 'src/reports';
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
    OrdersModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
