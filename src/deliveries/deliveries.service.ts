import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryStatus } from '@prisma/client';
import { DateService } from 'src/date';
import { PrismaService } from 'src/prisma';

import { CreateDeliveryDto, UpdateDeliveryDto } from './dtos';

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dateService: DateService
  ) {}

  async createDelivery(createDeliveryDto: CreateDeliveryDto) {
    const { orderIds, ...deliveryData } = createDeliveryDto;

    // Check existence of orders
    const orders = await this.prisma.order.findMany({
      where: {
        id: { in: orderIds },
      },
    });

    if (orders.length !== orderIds.length) {
      throw new BadRequestException('One or more orders do not exist');
    }

    const createdAt = this.dateService.getCurrentUnixTimestamp().toString();
    // update field attribute shipperId in each order of orders
    orders.forEach(async (order) => {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          shipperId: deliveryData.staffId,
        },
      });
    });
    return this.prisma.delivery.create({
      data: {
        ...deliveryData,
        createdAt,
        DeliveryStatusHistory: {
          create: {
            status: DeliveryStatus.PENDING,
            time: createdAt,
          },
        },
        orders: {
          connect: orderIds.map((id) => ({ id })),
        },
      },
    });
  }

  async getDeliveries() {
    return this.prisma.delivery.findMany({
      include: {
        DeliveryStatusHistory: true,
        orders: true,
      },
    });
  }

  async getDelivery(id: string) {
    return this.prisma.delivery.findUnique({
      where: { id },
      include: {
        DeliveryStatusHistory: true,
        orders: true,
      },
    });
  }

  async updateDelivery(id: string, updateDeliveryDto: UpdateDeliveryDto) {
    const { orderIds, ...deliveryData } = updateDeliveryDto;

    // Check existence and status of delivery
    const delivery = await this.prisma.delivery.findUnique({ where: { id } });
    const latestDeliveryStatus = await this.prisma.deliveryStatusHistory.findFirst({
      where: { deliveryId: id },
      orderBy: { time: 'desc' },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (latestDeliveryStatus.status !== DeliveryStatus.PENDING) {
      throw new BadRequestException('You can only update deliveries that are pending');
    }

    // Check existence of orders
    const orders = await this.prisma.order.findMany({
      where: {
        id: { in: orderIds },
      },
    });

    if (orders.length !== orderIds.length) {
      throw new BadRequestException('One or more orders do not exist');
    }

    const updatedDelivery = await this.prisma.delivery.update({
      where: { id },
      data: {
        limitTime: deliveryData.limitTime,
        staffId: deliveryData.staffId,
        orders: {
          set: orderIds.map((id) => ({ id })),
        },
      },
    });

    return updatedDelivery;
  }

  async updateDeliveryStatus(id: string, status: DeliveryStatus) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id } });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    return this.prisma.delivery.update({
      where: { id },
      data: {
        DeliveryStatusHistory: {
          create: {
            status,
            time: this.dateService.getCurrentUnixTimestamp().toString(),
          },
        },
      },
    });
  }

  async deleteDelivery(id: string) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id } });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    const latestDeliveryStatus = await this.prisma.deliveryStatusHistory.findFirst({
      where: { deliveryId: id },
      orderBy: { time: 'desc' },
    });
    if (latestDeliveryStatus.status !== DeliveryStatus.PENDING) {
      throw new BadRequestException('You can only delete deliveries that are pending');
    }

    return this.prisma.delivery.delete({ where: { id } });
  }
}
