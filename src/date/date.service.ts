import { Inject, Injectable } from '@nestjs/common';
import moment from 'moment';

@Injectable()
export class DateService {
  constructor(
    @Inject('MomentWrapper')
    private readonly moment: (inp?: moment.MomentInput, strict?: boolean) => moment.Moment
  ) {}

  getCurrentDate(): string {
    return this.moment().format('YYYY-MM-DD');
  }

  getCurrentUnixTimestamp(): number {
    return this.moment().unix();
  }

  getDaysBetweenDates(date1: string, date2: string): number {
    const start = this.moment(date1);
    const end = this.moment(date2);
    return end.diff(start, 'days');
  }
}
