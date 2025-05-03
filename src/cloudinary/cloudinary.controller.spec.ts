import { Test, TestingModule } from '@nestjs/testing';

import { CloudinaryController } from './cloudinary.controller';
import { CloudinaryService } from './cloudinary.service';

describe('CloudinaryController', () => {
  let controller: CloudinaryController;
  let service: CloudinaryService;

  const mockCloudinaryService = {
    uploadImage: jest.fn(),
    updateImage: jest.fn(),
    deleteImage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CloudinaryController],
      providers: [
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    controller = module.get<CloudinaryController>(CloudinaryController);
    service = module.get<CloudinaryService>(CloudinaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      const mockFile = { buffer: Buffer.from('test-image-buffer') } as Express.Multer.File;
      const mockResult = { secure_url: 'https://test-url.com/image.jpg' };
      mockCloudinaryService.uploadImage.mockResolvedValue(mockResult);

      const result = await controller.uploadImage(mockFile);

      expect(result).toEqual(mockResult);
      expect(service.uploadImage).toHaveBeenCalledWith(mockFile.buffer);
    });

    it('should throw when fail to upload image', async () => {
      const mockFile = { buffer: Buffer.from('test-image-buffer') } as Express.Multer.File;

      const mockError = new Error('Cloudinary upload error');
      mockCloudinaryService.uploadImage.mockRejectedValue(mockError);

      await expect(controller.uploadImage(mockFile)).rejects.toThrow('Failed to upload image');
    });
  });

  describe('updateImage', () => {
    it('should update image successfully', async () => {
      const fileBuffer = { buffer: Buffer.from('test-image-buffer') } as Express.Multer.File;
      const publicId = 'test-public-id';
      const mockResult = { secure_url: 'https://test-url.com/image.jpg' };
      mockCloudinaryService.updateImage.mockResolvedValue(mockResult);

      const result = await controller.updateImage(publicId, fileBuffer);

      expect(result).toEqual(mockResult);
      expect(service.updateImage).toHaveBeenCalledWith(publicId, fileBuffer.buffer);
    });

    it('should throw when fail to update image', async () => {
      const fileBuffer = { buffer: Buffer.from('test-image-buffer') } as Express.Multer.File;
      const publicId = 'test-public-id';

      const mockError = new Error('Cloudinary update error');
      mockCloudinaryService.updateImage.mockRejectedValue(mockError);

      await expect(controller.updateImage(publicId, fileBuffer)).rejects.toThrow(
        'Failed to update image'
      );
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      const publicId = 'test-public-id';
      mockCloudinaryService.deleteImage.mockResolvedValue(undefined);

      await controller.deleteImage(publicId);

      expect(service.deleteImage).toHaveBeenCalledWith(publicId);
    });

    it('should throw when fail to delete image', async () => {
      const publicId = 'test-public-id';

      const mockError = new Error('Cloudinary delete error');
      mockCloudinaryService.deleteImage.mockRejectedValue(mockError);

      await expect(controller.deleteImage(publicId)).rejects.toThrow('Failed to delete image');
    });
  });
});
