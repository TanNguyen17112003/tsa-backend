import { Global, Module } from '@nestjs/common';

import { CloudinaryController } from './cloudinary.controller';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryServiceImpl } from './cloudinary.service.impl';

@Global()
@Module({
  providers: [
    {
      provide: CloudinaryService,
      useClass: CloudinaryServiceImpl,
    },
  ],
  controllers: [CloudinaryController],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
