import { Module } from '@nestjs/common';
import * as moment from 'moment';

import { DateService } from './date.service';

const MomentWrapper = {
  provide: 'MomentWrapper',
  useValue: moment,
};
@Module({
  providers: [DateService, MomentWrapper],
  exports: [DateService],
})
export class DateModule {}
