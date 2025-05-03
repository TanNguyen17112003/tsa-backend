import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { v2 } from 'cloudinary';

import { CloudinaryService } from './cloudinary.service';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should upload image to default folder successfully', async () => {
      const fileBuffer = Buffer.from('test-image-buffer');

      const mockResult = { secure_url: 'https://test-url.com/image.jpg' };
      const uploadStreamMock = (options: any, callback: any) => {
        callback(null, mockResult);
        return { end: jest.fn() };
      };
      (v2.uploader.upload_stream as jest.Mock).mockImplementation(uploadStreamMock);

      const result = await service.uploadImage(fileBuffer);

      expect(result).toEqual(mockResult);
      expect(v2.uploader.upload_stream).toHaveBeenCalledWith(
        { folder: 'tsa_image' },
        expect.any(Function)
      );
    });

    it('should upload image to custom folder successfully', async () => {
      const fileBuffer = Buffer.from('test-image-buffer');
      const folder = 'custom_folder';

      const mockResult = { secure_url: `https://test-url.com/${folder}/image.jpg` };
      const uploadStreamMock = (options: any, callback: any) => {
        callback(null, mockResult);
        return { end: jest.fn() };
      };
      (v2.uploader.upload_stream as jest.Mock).mockImplementation(uploadStreamMock);

      const result = await service.uploadImage(fileBuffer, folder);

      expect(result).toEqual(mockResult);
      expect(v2.uploader.upload_stream).toHaveBeenCalledWith({ folder }, expect.any(Function));
    });
    it('should throw error when upload fails', async () => {
      const fileBuffer = Buffer.from('test-image-buffer');

      const mockError = new Error('Upload failed');
      const uploadStreamMock = (options: any, callback: any) => {
        callback(mockError);
        return { end: jest.fn() };
      };
      (v2.uploader.upload_stream as jest.Mock).mockImplementation(uploadStreamMock);

      await expect(service.uploadImage(fileBuffer)).rejects.toThrow(mockError);
    });
  });

  describe('updateImage', () => {
    it('should update image successfully', async () => {
      const fileBuffer = Buffer.from('test-image-buffer');
      const publicId = 'test_public_id';

      const mockResult = { secure_url: 'https://test-url.com/image.jpg' };
      const uploadStreamMock = (options: any, callback: any) => {
        callback(null, mockResult);
        return { end: jest.fn() };
      };
      (v2.uploader.upload_stream as jest.Mock).mockImplementation(uploadStreamMock);

      const result = await service.updateImage(publicId, fileBuffer);

      expect(result).toEqual(mockResult);
      expect(v2.uploader.upload_stream).toHaveBeenCalledWith(
        { folder: 'tsa_image', public_id: publicId },
        expect.any(Function)
      );
    });

    it('should throw error when update fails', async () => {
      const fileBuffer = Buffer.from('test-image-buffer');
      const publicId = 'test_public_id';

      const mockError = new Error('Update failed');
      const uploadStreamMock = (options: any, callback: any) => {
        callback(mockError);
        return { end: jest.fn() };
      };
      (v2.uploader.upload_stream as jest.Mock).mockImplementation(uploadStreamMock);

      await expect(service.updateImage(publicId, fileBuffer)).rejects.toThrow(mockError);
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      const publicId = 'test_public_id';

      const mockResult = { result: 'ok' };
      (v2.uploader.destroy as jest.Mock).mockImplementation((id, callback) => {
        callback(null, mockResult);
      });

      await service.deleteImage(publicId);

      expect(v2.uploader.destroy).toHaveBeenCalledWith(publicId, expect.any(Function));
    });

    it('should throw error when delete fails', async () => {
      const publicId = 'test_public_id';

      const mockError = new Error('Delete failed');
      (v2.uploader.destroy as jest.Mock).mockImplementation((id, callback) => {
        callback(mockError);
      });

      await expect(service.deleteImage(publicId)).rejects.toThrow(mockError);
    });
  });
});
