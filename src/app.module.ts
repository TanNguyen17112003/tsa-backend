import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth';
import { AppController } from 'src/controllers/app.controller';
import { SampleController } from 'src/controllers/sample.controller';
import { DateModule } from 'src/date';
import { EmailModule } from 'src/email';
import { OrdersController } from 'src/models/orders/orders.controller';
import { ReportsController } from 'src/models/reports/reports.controller';
import { PrismaModule } from 'src/prisma';
import { AppService } from 'src/services/app.service';
import { SampleService } from 'src/services/sample.service';
import { UsersModule } from 'src/users';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    DateModule,
    EmailModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController, SampleController, OrdersController, ReportsController],
  providers: [AppService, SampleService],
})
export class AppModule {}
