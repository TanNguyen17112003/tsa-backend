import { Injectable } from '@nestjs/common';
import moment from 'moment';

@Injectable()
export class DateService {
  getCurrentDate(): string {
    return moment().format('YYYY-MM-DD');
  }
  getCurrentUnixTimestamp(): number {
    return moment().unix();
  }
  getDaysBetweenDates(date1: string, date2: string): number {
    const start = moment(date1);
    const end = moment(date2);
    return end.diff(start, 'days');
  }
}
