import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PythonApiService } from './python-api.service';
import { PythonApiServiceImpl } from './python-api.service.impl';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PythonApiService,
      useClass: PythonApiServiceImpl,
    },
  ],
  exports: [PythonApiService], // 👈 để module khác có thể dùng
})
export class PythonApiModule {}
