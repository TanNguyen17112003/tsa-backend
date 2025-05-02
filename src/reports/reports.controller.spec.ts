import { Test, TestingModule } from '@nestjs/testing';
import { GetUserType } from 'src/types';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;

  const mockService = {
    createReport: jest.fn(),
    getReports: jest.fn(),
    getReport: jest.fn(),
    updateReport: jest.fn(),
    deleteReport: jest.fn(),
  };

  const mockUser: GetUserType = {
    id: 's1',
    role: 'STUDENT',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: mockService }],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
  });

  it('should create a report', async () => {
    mockService.createReport.mockResolvedValue({ id: 'r1' });
    const result = await controller.create({ orderId: 'o1', studentId: 's1' } as any, mockUser);
    expect(result).toEqual({ id: 'r1' });
  });

  it('should get all reports', async () => {
    mockService.getReports.mockResolvedValue({ results: [], totalElements: 0, totalPages: 0 });
    const result = await controller.findAll({ page: 1, size: 10 }, mockUser);
    expect(result.results).toEqual([]);
  });

  it('should get one report by ID', async () => {
    mockService.getReport.mockResolvedValue({ id: 'r1' });
    const result = await controller.findOne('r1');
    expect(result).toEqual({ id: 'r1' });
  });

  it('should update a report', async () => {
    mockService.updateReport.mockResolvedValue({ id: 'r1', reply: 'ok' });
    const result = await controller.update('r1', { reply: 'ok' } as any, mockUser);
    expect(result).toEqual({ id: 'r1', reply: 'ok' });
  });

  it('should delete a report', async () => {
    const user: GetUserType = {
      id: 'admin',
      role: 'ADMIN',
      email: '',
    };
    mockService.deleteReport.mockResolvedValue({ id: 'r1' });
    const result = await controller.remove('r1', user);
    expect(result).toEqual({ id: 'r1' });
  });
});
