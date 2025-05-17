import { Module } from '@nestjs/common';
import { NotificationsModule } from 'src/notifications/notifications.module';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsServiceImpl } from './reports.service.impl';

@Module({
  imports: [NotificationsModule],
  controllers: [ReportsController],
  providers: [
    {
      provide: ReportsService,
      useClass: ReportsServiceImpl,
    },
  ],
})
export class ReportsModule {}
