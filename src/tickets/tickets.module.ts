import { Module } from '@nestjs/common';

import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketsServiceImpl } from './tickets.service.impl';

@Module({
  controllers: [TicketsController],
  providers: [
    {
      provide: TicketsService,
      useClass: TicketsServiceImpl,
    },
  ],
})
export class TicketsModule {}
