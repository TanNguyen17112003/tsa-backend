import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PythonApiService } from './python-api.service';

@Module({
  imports: [ConfigModule],
  providers: [PythonApiService],
  exports: [PythonApiService], // 👈 để module khác có thể dùng
})
export class PythonApiModule {}
