import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Dormitory } from '@prisma/client';
import { PrismaService } from 'src/prisma';

import { UpdateBanThresholdDto } from './dto/ban.dto';
import { GetRegulationDto } from './dto/get-regulation.dto';
import { CreateSlotDto, RemoveSlotDto, UpdateSlotDto } from './dto/slot.dto';
import { RegulationService } from './regulation.service';

@Injectable()
export class RegulationServiceImpl extends RegulationService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  override async getAllRegulations(): Promise<GetRegulationDto[]> {
    const regulations = await this.prisma.dormitoryRegulation.findMany({
      where: {
        name: {
          in: Object.values(Dormitory),
        },
      },
      include: {
        deliverySlots: true,
      },
    });
    if (!regulations || regulations.length === 0) {
      throw new NotFoundException('Không tìm thấy bất cứ quy định nào trong hệ thống');
    }

    return regulations;
  }

  override async getRegulation(dormitory: Dormitory): Promise<GetRegulationDto> {
    const regulation = await this.prisma.dormitoryRegulation.findFirst({
      where: {
        name: dormitory,
      },
      include: {
        deliverySlots: true,
      },
    });
    if (!regulation) {
      throw new NotFoundException('Không tìm thấy quy định cho ký túc xá này');
    }
    return regulation;
  }

  override async addDeliverySlot(dormitoryId: string, dto: CreateSlotDto): Promise<void> {
    const existingSlot = await this.prisma.allowedDeliverySlot.findFirst({
      where: {
        regulationId: dormitoryId,
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
    });

    if (existingSlot) {
      throw new ConflictException('Timeslot này đã có sẵn trong quy định của KTX này');
    }

    await this.prisma.$transaction([
      this.prisma.dormitoryRegulation.update({
        where: { id: dormitoryId },
        data: {
          updateAt: new Date(),
        },
      }),
      this.prisma.allowedDeliverySlot.create({
        data: {
          regulationId: dormitoryId,
          startTime: dto.startTime,
          endTime: dto.endTime,
        },
      }),
    ]);
  }

  override async updateDeliverySlot(dormitoryId: string, dto: UpdateSlotDto): Promise<void> {
    const existingSlot = await this.prisma.allowedDeliverySlot.findFirst({
      where: {
        regulationId: dormitoryId,
        id: dto.id,
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
    });

    if (existingSlot) {
      throw new ConflictException('Timeslot này đã có sẵn trong quy định của KTX này');
    }

    await this.prisma.$transaction([
      this.prisma.dormitoryRegulation.update({
        where: { id: dormitoryId },
        data: {
          updateAt: new Date(),
        },
      }),
      this.prisma.allowedDeliverySlot.update({
        where: {
          regulationId: dormitoryId,
          id: dto.id,
        },
        data: {
          startTime: dto.startTime,
          endTime: dto.endTime,
        },
      }),
    ]);
  }

  override async removeDeliverySlot(dormitoryId: string, dto: RemoveSlotDto): Promise<void> {
    const existingSlot = await this.prisma.allowedDeliverySlot.findFirst({
      where: {
        regulationId: dormitoryId,
        id: dto.id,
      },
    });

    if (!existingSlot) {
      throw new ConflictException('Timeslot này không tồn tại trong quy định của KTX này');
    }

    await this.prisma.$transaction([
      this.prisma.dormitoryRegulation.update({
        where: { id: dormitoryId },
        data: {
          updateAt: new Date(),
        },
      }),
      this.prisma.allowedDeliverySlot.delete({
        where: {
          regulationId: dormitoryId,
          id: dto.id,
        },
      }),
    ]);
  }

  override async updateBanThreshold(
    dormitoryId: string,
    dto: UpdateBanThresholdDto
  ): Promise<void> {
    const regulation = await this.prisma.dormitoryRegulation.findFirst({
      where: {
        id: dormitoryId,
      },
    });
    if (!regulation) {
      throw new NotFoundException('Không tìm thấy quy định cho ký túc xá này');
    }
    await this.prisma.dormitoryRegulation.update({
      where: {
        id: dormitoryId,
      },
      data: {
        banThreshold: dto.banThreshold,
      },
    });
  }
}
