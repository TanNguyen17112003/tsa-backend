import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth';
import { AppController } from 'src/controllers/app.controller';
import { SampleController } from 'src/controllers/sample.controller';
import { UserController } from 'src/controllers/user.controller';
import { DateModule } from 'src/date';
import { EmailModule } from 'src/email';
import { OrdersController } from 'src/models/orders/orders.controller';
import { ReportsController } from 'src/models/reports/reports.controller';
import { PrismaModule } from 'src/prisma';
import { AppService } from 'src/services/app.service';
import { SampleService } from 'src/services/sample.service';
import { UserService } from 'src/services/user.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    DateModule,
    EmailModule,
    AuthModule,
  ],
  controllers: [
    AppController,
    UserController,
    SampleController,
    OrdersController,
    ReportsController,
  ],
  providers: [AppService, UserService, SampleService],
})
export class AppModule {}
