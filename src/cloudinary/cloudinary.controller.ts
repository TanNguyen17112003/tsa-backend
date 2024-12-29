import {
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { AllowAuthenticated } from 'src/auth';

import { CloudinaryService } from './cloudinary.service';

@ApiTags('Cloud')
@ApiBearerAuth('JWT-Auth')
@Controller('api/cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @AllowAuthenticated('STUDENT', 'STAFF')
  @ApiOperation({ summary: 'Upload image to Cloudinary' })
  @Post('')
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async uploadImage(@UploadedFile() image: Express.Multer.File) {
    try {
      const result = await this.cloudinaryService.uploadImage(image.buffer);
      return result;
    } catch (error) {
      console.error('Error uploading image', error);
      throw new Error('Failed to upload image');
    }
  }

  @AllowAuthenticated('STUDENT')
  @ApiOperation({ summary: 'Update new image to Cloudinary' })
  @Put(':id')
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async updateImage(@Param('id') id: string, @UploadedFile() image: Express.Multer.File) {
    try {
      const result = await this.cloudinaryService.updateImage(id, image.buffer);
      return result;
    } catch (error) {
      console.error('Error updating image', error);
      throw new Error('Failed to update image');
    }
  }

  @AllowAuthenticated('STUDENT')
  @ApiOperation({ summary: 'Delete image from Cloudinary' })
  @Delete(':id')
  async deleteImage(@Param('id') id: string) {
    try {
      await this.cloudinaryService.deleteImage(id);
      return { message: 'Image deleted successfully' };
    } catch (error) {
      console.error('Error deleting image', error);
      throw new Error('Failed to delete image');
    }
  }
}
