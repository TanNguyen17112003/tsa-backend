import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryStatus, OrderStatus } from '@prisma/client';
import { DateService } from 'src/date';
import { NotificationsService } from 'src/notifications/notifications.service';
import { createOrderStatusHistory } from 'src/orders/utils/order.util';
import { PrismaService } from 'src/prisma';
import { GetUserType } from 'src/types';

import { CreateDeliveryDto, UpdateDeliveryDto } from './dtos';

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dateService: DateService,
    private readonly notificationService: NotificationsService
  ) {}

  async createDelivery(createDeliveryDto: CreateDeliveryDto) {
    const { orderIds, ...deliveryData } = createDeliveryDto;

    // Check existence of orders
    const orders = await this.prisma.order.findMany({
      where: {
        id: { in: orderIds },
      },
      include: {
        deliveries: true,
      },
    });

    if (orders.length !== orderIds.length) {
      throw new BadRequestException('One or more orders do not exist');
    }

    // Check if there exists an order that is put into some delivery but is not canceled
    if (
      orders.some(
        (order) => order.deliveries.length > 0 && order.latestStatus !== OrderStatus.CANCELED
      )
    ) {
      throw new BadRequestException('One or more orders are already in a delivery');
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

    const newDelivery = await this.prisma.delivery.create({
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
    await this.notificationService.sendNotification({
      type: 'DELIVERY',
      title: 'Chuyến đi mới vừa được tạo',
      content: 'Bạn vừa được giao một chuyến đi mới',
      deliveryId: newDelivery.id,
      orderId: undefined,
      reportId: undefined,
      userId: deliveryData.staffId,
    });
    return newDelivery;
  }

  async getDeliveries(user: GetUserType) {
    return this.prisma.delivery.findMany({
      where: user.role === 'ADMIN' ? {} : { staffId: user.id },
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
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        orders: true,
      },
    });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    await this.notificationService.sendNotification({
      type: 'DELIVERY',
      title: 'Thay đổi trạng thái chuyến đi',
      content:
        status === 'CANCELED'
          ? 'Chuyến đi đã bị hủy'
          : status === 'FINISHED'
            ? 'Chuyến đi đã hoàn thành'
            : 'Chuyến đi đang vận chuyển',
      deliveryId: delivery.id,
      orderId: undefined,
      reportId: undefined,
      userId: delivery.staffId,
    });

    if (status === DeliveryStatus.ACCEPTED) {
      await Promise.all(
        delivery.orders.map((order) =>
          createOrderStatusHistory(this.prisma, order.id, OrderStatus.IN_TRANSPORT)
        )
      );
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
