import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';

import { CloudinaryService } from './cloudinary.service';

@Injectable()
export class CloudinaryServiceImpl extends CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {
    super();
    v2.config({
      cloud_name: this.configService.get<string>('CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUD_API_KEY'),
      api_secret: this.configService.get<string>('CLOUD_API_SECRET'),
    });
  }

  override async uploadImage(fileBuffer: Buffer, folder = 'tsa_image'): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      v2.uploader
        .upload_stream({ folder }, (error, result) => {
          if (error) {
            this.logger.error('Error uploading image', error);
            reject(error);
          } else {
            resolve(result);
          }
        })
        .end(fileBuffer);
    });
  }

  override async updateImage(
    publicId: string,
    fileBuffer: Buffer
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      v2.uploader
        .upload_stream({ folder: 'tsa_image', public_id: publicId }, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        })
        .end(fileBuffer);
    });
  }

  override async deleteImage(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      v2.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }
}
