import { Global, Module } from '@nestjs/common';

import { IdGeneratorService } from './id-generator.service';
import { IdGeneratorServiceImpl } from './id-generator.service.impl';

@Global()
@Module({
  providers: [
    {
      provide: IdGeneratorService,
      useClass: IdGeneratorServiceImpl,
    },
  ],
  exports: [IdGeneratorService],
})
export class IdGeneratorModule {}
