import { Global, Module } from '@nestjs/common';
import moment from 'moment';

import { DateService } from './date.service';
import { DateServiceImpl } from './date.service.impl';

const MomentWrapper = {
  provide: 'MomentWrapper',
  useValue: moment,
};

@Global()
@Module({
  providers: [
    {
      provide: DateService,
      useClass: DateServiceImpl,
    },
    MomentWrapper,
  ],
  exports: [DateService],
})
export class DateModule {}
