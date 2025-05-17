import { Injectable, NotFoundException } from '@nestjs/common';
import * as tesseract from 'node-tesseract-ocr';
import { PrismaService } from 'src/prisma';

import { RecognitionQueryDto, RecognitionResponseDto } from './dtos';
import { RecognitionEntity } from './entities/recognition.entity';
import { RecognitionService } from './recognition.service';

@Injectable()
export class RecognitionServiceImpl extends RecognitionService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  override async createRecognition(file: Express.Multer.File): Promise<RecognitionResponseDto> {
    const config = {
      lang: 'vie',
      oem: 1,
      psm: 3,
    };

    const text = await tesseract.recognize(file.path, config);
    await this.prisma.recognition.create({ data: { text } });
    const isBelongedToShopee = text.includes('SPX');
    const isBelongedToSendo = text.includes('Sendo');
    if (!isBelongedToSendo && !isBelongedToShopee) {
      throw new NotFoundException('This image is not belonged to Sendo or Shopee');
    }

    const orderIdPattern = /Mã.*hàng:\s*([^\r\n\t]+)/;
    const match = text.match(orderIdPattern);
    if (!match) {
      throw new NotFoundException('Order ID not found');
    }

    const orderId = match[1].replace(/\s+/g, '').trim();

    return {
      orderId,
      brand: isBelongedToSendo ? 'Sendo' : 'Shopee',
    };
  }

  override async getRecognitions(query: RecognitionQueryDto): Promise<RecognitionEntity[]> {
    const { page, size } = query;
    const recognitions = await this.prisma.recognition.findMany({
      skip: (page - 1) * size,
      take: size,
    });

    return recognitions;
  }

  override async getRecognition(id: string): Promise<RecognitionEntity> {
    const recognition = await this.prisma.recognition.findUnique({ where: { id } });
    if (!recognition) {
      throw new NotFoundException('Recognition not found');
    }
    return recognition;
  }
}
