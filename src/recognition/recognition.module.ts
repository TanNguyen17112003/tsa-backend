import { Module } from '@nestjs/common';

import { RecognitionController } from './recognition.controller';
import { RecognitionService } from './recognition.service';
import { RecognitionServiceImpl } from './recognition.service.impl';

@Module({
  controllers: [RecognitionController],
  providers: [
    {
      provide: RecognitionService,
      useClass: RecognitionServiceImpl,
    },
  ],
})
export class RecognitionModule {}
