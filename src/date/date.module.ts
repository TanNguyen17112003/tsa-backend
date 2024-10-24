import { Global, Module } from '@nestjs/common';
import moment from 'moment';

import { DateService } from './date.service';

const MomentWrapper = {
  provide: 'MomentWrapper',
  useValue: moment,
};

@Global()
@Module({
  providers: [DateService, MomentWrapper],
  exports: [DateService],
})
export class DateModule {}
