import { Module } from '@nestjs/common';
import { NotificationsModule } from 'src/notifications/notifications.module';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [NotificationsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
