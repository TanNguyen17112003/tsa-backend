import { Module } from '@nestjs/common';

import { RegulationController } from './regulation.controller';
import { RegulationService } from './regulation.service';
import { RegulationServiceImpl } from './regulation.service.impl';

@Module({
  controllers: [RegulationController],
  providers: [
    {
      provide: RegulationService,
      useClass: RegulationServiceImpl,
    },
  ],
})
export class RegulationModule {}
