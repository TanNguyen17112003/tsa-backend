import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersServiceImpl } from './users.service.impl';

@Module({
  controllers: [UsersController],
  providers: [
    {
      provide: UsersService,
      useClass: UsersServiceImpl,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
