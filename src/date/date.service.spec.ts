import { Test, TestingModule } from '@nestjs/testing';
import moment from 'moment';

import { DateServiceImpl } from './date.service.impl';

describe('DateServiceImpl', () => {
  let service: DateServiceImpl;

  const mockMoment = jest.fn((inp?: moment.MomentInput) => moment(inp));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DateServiceImpl,
        {
          provide: 'MomentWrapper',
          useValue: mockMoment,
        },
      ],
    }).compile();

    service = module.get<DateServiceImpl>(DateServiceImpl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentDate', () => {
    it('should return the current date in YYYY-MM-DD format', () => {
      const mockDate = '2023-01-01';
      mockMoment.mockReturnValue(moment(mockDate));

      const result = service.getCurrentDate();

      expect(result).toBe(mockDate);
      expect(mockMoment).toHaveBeenCalledWith();
    });
  });

  describe('getCurrentUnixTimestamp', () => {
    it('should return the current Unix timestamp', () => {
      const mockUnixTimestamp = 1672531200;
      mockMoment.mockReturnValue({
        unix: jest.fn().mockReturnValue(mockUnixTimestamp),
      } as any);

      const result = service.getCurrentUnixTimestamp();

      expect(result).toBe(mockUnixTimestamp);
      expect(mockMoment).toHaveBeenCalledWith();
    });
  });

  describe('getDaysBetweenDates', () => {
    it('should return the number of days between two dates', () => {
      const date1 = '2023-01-01';
      const date2 = '2023-01-10';
      const expectedDays = 9;
      const mockStart = moment(date1);
      const mockEnd = moment(date2);

      mockMoment.mockImplementation((inp?: moment.MomentInput) => {
        if (inp === date1) return mockStart;
        if (inp === date2) return mockEnd;
        return moment(inp);
      });

      jest.spyOn(mockEnd, 'diff').mockReturnValue(expectedDays);

      const result = service.getDaysBetweenDates(date1, date2);

      expect(result).toBe(expectedDays);
      expect(mockMoment).toHaveBeenCalledWith(date1);
      expect(mockMoment).toHaveBeenCalledWith(date2);
      expect(mockEnd.diff).toHaveBeenCalledWith(mockStart, 'days');
    });
  });
});
