import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DateModule } from 'src/common/date/date.module';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { AppController } from 'src/controllers/app.controller';
import { SampleController } from 'src/controllers/sample.controller';
import { UserController } from 'src/controllers/user.controller';
import { OrdersController } from 'src/models/orders/orders.controller';
import { ReportsController } from 'src/models/reports/reports.controller';
import { AppService } from 'src/services/app.service';
import { SampleService } from 'src/services/sample.service';
import { UserService } from 'src/services/user.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    DateModule,
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
