import { Body, Injectable, NotFoundException, Param } from '@nestjs/common';
// import { User } from 'src/models/user.model';
import { CreateSampleDto } from 'src/dto/sample.dto';
import { Sample } from 'src/models/sample.model';
import { PrismaService } from 'src/prisma';

@Injectable()
export class SampleService {
  constructor(private prismaService: PrismaService) {}

  async create(@Body() body: CreateSampleDto): Promise<Sample> {
    const newSample = await this.prismaService.sample.create({
      data: {
        content: body.content,
      },
    });
    return newSample;
  }

  async getAll(): Promise<Sample[]> {
    const samples = await this.prismaService.sample.findMany();
    return samples;
  }
  async getById(@Param('id') id: string): Promise<Sample> {
    const sample = await this.prismaService.sample.findUnique({
      where: { id },
    });

    if (!sample) {
      throw new NotFoundException('Sample not found');
    }

    return sample;
  }

  async update(@Param('id') id: string, @Body() body: CreateSampleDto): Promise<Sample> {
    const sample = await this.prismaService.sample.findUnique({
      where: { id },
    });

    if (!sample) {
      throw new NotFoundException('Sample not found');
    }

    const updatedSample = await this.prismaService.sample.update({
      where: { id },
      data: {
        ...body,
      },
    });

    return updatedSample;
  }

  async delete(@Param('id') id: string): Promise<void> {
    const sample = await this.prismaService.sample.findUnique({
      where: { id },
    });

    if (!sample) {
      throw new NotFoundException('Sample not found');
    }

    await this.prismaService.sample.delete({
      where: { id },
    });
  }
}
