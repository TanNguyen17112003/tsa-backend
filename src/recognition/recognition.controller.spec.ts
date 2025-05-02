import { Test, TestingModule } from '@nestjs/testing';

import { RecognitionEntity } from './entities/recognition.entity';
import { RecognitionController } from './recognition.controller';
import { RecognitionService } from './recognition.service';

describe('RecognitionController', () => {
  let controller: RecognitionController;

  const mockRecognitionService = {
    createRecognition: jest.fn(),
    getRecognitions: jest.fn(),
    getRecognition: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecognitionController],
      providers: [
        {
          provide: RecognitionService,
          useValue: mockRecognitionService,
        },
      ],
    }).compile();

    controller = module.get<RecognitionController>(RecognitionController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call service.createRecognition and return response', async () => {
      const mockFile = { path: 'path' } as Express.Multer.File;
      const expected = { orderId: 'abc123', brand: 'Shopee' };
      mockRecognitionService.createRecognition.mockResolvedValue(expected);

      const result = await controller.create(mockFile);
      expect(result).toEqual(expected);
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const query = { page: 1, size: 5 };
      const expected: RecognitionEntity[] = [{ id: '1', text: 'text' } as any];
      mockRecognitionService.getRecognitions.mockResolvedValue(expected);

      const result = await controller.findAll(query);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should return one recognition by ID', async () => {
      const mockRecognition = { id: '123', text: 'detected text' };
      mockRecognitionService.getRecognition.mockResolvedValue(mockRecognition);

      const result = await controller.findOne('123');
      expect(result).toEqual(mockRecognition);
    });
  });
});
