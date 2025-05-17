export abstract class DateService {
  abstract getCurrentDate(): string;
  abstract getCurrentUnixTimestamp(): number;
  abstract getDaysBetweenDates(date1: string, date2: string): number;
  abstract getDateFromUnixTimestamp(timestamp: number): string;
}
