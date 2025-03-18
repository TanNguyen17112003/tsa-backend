import { Injectable, NotFoundException } from '@nestjs/common';
import * as tesseract from 'node-tesseract-ocr';
import { PrismaService } from 'src/prisma';

import { RecognitionQueryDto } from './dtos';
import { RecognitionEntity } from './entities/recognition.entity';

@Injectable()
export class RecognitionService {
  constructor(private readonly prisma: PrismaService) {}

  async createRecognition(file: Express.Multer.File): Promise<RecognitionEntity> {
    const config = {
      lang: 'vie',
      oem: 1,
      psm: 3,
    };

    const text = await tesseract.recognize(file.path, config);

    const recognition = await this.prisma.recognition.create({
      data: {
        text,
      },
    });

    return recognition;
  }

  async getRecognitions(query: RecognitionQueryDto): Promise<RecognitionEntity[]> {
    const { page, size } = query;
    const recognitions = await this.prisma.recognition.findMany({
      skip: (page - 1) * size,
      take: size,
    });

    return recognitions;
  }

  async getRecognition(id: string): Promise<RecognitionEntity> {
    const recognition = await this.prisma.recognition.findUnique({ where: { id } });
    if (!recognition) {
      throw new NotFoundException('Recognition not found');
    }
    return recognition;
  }
}
