import { Module } from '@nestjs/common';

import { Cloudinary } from './cloudinary';
import { CloudinaryController } from './cloudinary.controller';
import { CloudinaryService } from './cloudinary.service';

@Module({
  providers: [Cloudinary, CloudinaryService],
  controllers: [CloudinaryController],
})
export class CloudinaryModule {}
