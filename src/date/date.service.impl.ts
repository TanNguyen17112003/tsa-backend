import { Inject, Injectable } from '@nestjs/common';
import moment from 'moment';

import { DateService } from './date.service';

@Injectable()
export class DateServiceImpl extends DateService {
  constructor(
    @Inject('MomentWrapper')
    private readonly moment: (inp?: moment.MomentInput, strict?: boolean) => moment.Moment
  ) {
    super();
  }

  override getCurrentDate(): string {
    return this.moment().format('YYYY-MM-DD');
  }

  override getCurrentUnixTimestamp(): number {
    return this.moment().unix();
  }

  override getDaysBetweenDates(date1: string, date2: string): number {
    const start = this.moment(date1);
    const end = this.moment(date2);
    return end.diff(start, 'days');
  }

  override getDateFromUnixTimestamp(timestamp: number): string {
    const date = new Date(timestamp * 1000); // từ giây -> mili giây
    const day = date.getDate(); // không cần padStart
    const month = date.getMonth() + 1; // tháng bắt đầu từ 0
    const year = date.getFullYear() % 100; // lấy 2 chữ số cuối của năm
    return `${day}/${month}/${year}`;
  }
}
