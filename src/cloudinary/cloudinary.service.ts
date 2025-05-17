import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

export abstract class CloudinaryService {
  abstract uploadImage(fileBuffer: Buffer, folder: string): Promise<UploadApiResponse>;
  abstract uploadImage(fileBuffer: Buffer): Promise<UploadApiResponse>;
  abstract updateImage(
    publicId: string,
    fileBuffer: Buffer
  ): Promise<UploadApiResponse | UploadApiErrorResponse>;
  abstract deleteImage(publicId: string): Promise<void>;
}
