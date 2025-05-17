import { Module } from '@nestjs/common';

import { FirebaseService } from './firebase.service';
import { FirebaseServiceImpl } from './firebase.service.impl';

@Module({
  providers: [
    {
      provide: FirebaseService,
      useClass: FirebaseServiceImpl,
    },
  ],
  exports: [FirebaseService],
})
export class FirebaseModule {}
