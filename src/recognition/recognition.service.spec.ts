import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as tesseract from 'node-tesseract-ocr';
import { PrismaService } from 'src/prisma';

import { RecognitionService } from './recognition.service';

jest.mock('node-tesseract-ocr');

describe('RecognitionService', () => {
  let service: RecognitionService;

  const mockPrisma = {
    recognition: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecognitionService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<RecognitionService>(RecognitionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('createRecognition', () => {
    it('should return orderId and brand if Shopee', async () => {
      const mockFile = { path: 'somepath' } as Express.Multer.File;
      const text = 'Mã đơn hàng: ABC123\nSPX';

      (tesseract.recognize as jest.Mock).mockResolvedValue(text);
      mockPrisma.recognition.create.mockResolvedValue({});

      const result = await service.createRecognition(mockFile);
      expect(result).toEqual({ orderId: 'ABC123', brand: 'Shopee' });
    });

    it('should return orderId and brand if Sendo', async () => {
      const mockFile = { path: 'somepath' } as Express.Multer.File;
      const text = 'Mã đơn hàng: XYZ789\nSendo';

      (tesseract.recognize as jest.Mock).mockResolvedValue(text);
      mockPrisma.recognition.create.mockResolvedValue({});

      const result = await service.createRecognition(mockFile);
      expect(result).toEqual({ orderId: 'XYZ789', brand: 'Sendo' });
    });

    it('should throw NotFoundException if brand not found', async () => {
      const mockFile = { path: 'somepath' } as Express.Multer.File;
      const text = 'Mã đơn hàng: ABC123\nUnknownBrand';

      (tesseract.recognize as jest.Mock).mockResolvedValue(text);
      mockPrisma.recognition.create.mockResolvedValue({});

      await expect(service.createRecognition(mockFile)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if orderId not found', async () => {
      const mockFile = { path: 'somepath' } as Express.Multer.File;
      const text = 'SPX only with no order id';

      (tesseract.recognize as jest.Mock).mockResolvedValue(text);
      mockPrisma.recognition.create.mockResolvedValue({});

      await expect(service.createRecognition(mockFile)).rejects.toThrow('Order ID not found');
    });
  });

  describe('getRecognitions', () => {
    it('should return recognitions paginated', async () => {
      const query = { page: 2, size: 10 };
      const mockData = [{ id: '1', text: 'sample' }];
      mockPrisma.recognition.findMany.mockResolvedValue(mockData);

      const result = await service.getRecognitions(query);
      expect(result).toEqual(mockData);
      expect(mockPrisma.recognition.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
      });
    });
  });

  describe('getRecognition', () => {
    it('should return recognition by id', async () => {
      const mockItem = { id: '1', text: 'something' };
      mockPrisma.recognition.findUnique.mockResolvedValue(mockItem);

      const result = await service.getRecognition('1');
      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.recognition.findUnique.mockResolvedValue(null);
      await expect(service.getRecognition('unknown')).rejects.toThrow('Recognition not found');
    });
  });
});
