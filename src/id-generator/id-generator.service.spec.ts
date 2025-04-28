import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma';

import { IdGeneratorService } from './id-generator.service';

describe('IdGeneratorService', () => {
  let service: IdGeneratorService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    delivery: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdGeneratorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<IdGeneratorService>(IdGeneratorService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateId', () => {
    it('should generate ID with prefix only', () => {
      const id = service.generateId('test');
      expect(id.startsWith('TEST-')).toBe(true);
      const parts = id.split('-');
      expect(parts.length).toBe(2);
      expect(parts[1].length).toBe(10);
    });

    it('should generate ID with prefix and context', () => {
      const id = service.generateId('order', 'urgent');
      expect(id.startsWith('ORDER-URGENT-')).toBe(true);
      const parts = id.split('-');
      expect(parts.length).toBe(3);
      expect(parts[2].length).toBe(10);
    });
  });

  describe('generateUniqueId', () => {
    it('should generate and return unique ID when not existing', async () => {
      mockPrismaService.delivery.findFirst.mockResolvedValue(null);

      const id = await service.generateUniqueId('delivery', 'displayId', 'DEL');

      expect(id.startsWith('DEL-')).toBe(true);
      expect(prismaService.delivery.findFirst).toHaveBeenCalledTimes(1);
    });

    it('should retry if ID already exists', async () => {
      mockPrismaService.delivery.findFirst
        .mockResolvedValueOnce({}) // First ID exists
        .mockResolvedValueOnce(null); // Second ID is unique

      const id = await service.generateUniqueId('delivery', 'displayId', 'DEL');

      expect(id.startsWith('DEL-')).toBe(true);
      expect(prismaService.delivery.findFirst).toHaveBeenCalledTimes(2);
    });

    it('should throw if cannot find unique ID after retries', async () => {
      mockPrismaService.delivery.findFirst.mockResolvedValue({});

      await expect(service.generateUniqueId('delivery', 'displayId', 'DEL')).rejects.toThrow(
        InternalServerErrorException
      );
      expect(prismaService.delivery.findFirst).toHaveBeenCalledTimes(5);
    });
  });
});
