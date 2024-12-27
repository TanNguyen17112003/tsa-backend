import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryStatus, OrderStatus } from '@prisma/client';
import { DateService } from 'src/date';
import { NotificationsService } from 'src/notifications/notifications.service';
import { createOrderStatusHistory } from 'src/orders/utils/order.util';
import { PrismaService } from 'src/prisma';
import { GetUserType } from 'src/types';

import {
  CreateDeliveryDto,
  DeliveryOrderDto,
  GetDeliveryDto,
  UpdateDeliveryDto,
  UpdateStatusDto,
} from './dtos';

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

  async getDeliveries(user: GetUserType): Promise<GetDeliveryDto[]> {
    const deliveriesWithStatusesAndOrders = await this.prisma.delivery.findMany({
      where: user.role === 'ADMIN' ? {} : { staffId: user.id },
      include: {
        DeliveryStatusHistory: true,
        orders: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    lastName: true,
                    firstName: true,
                    phoneNumber: true,
                    photoUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const responseData: GetDeliveryDto[] = deliveriesWithStatusesAndOrders.map((delivery) => {
      const orders: DeliveryOrderDto[] = delivery.orders.map((order) => {
        return {
          ...order,
          studentInfo: order.student.user,
          student: undefined,
        };
      });

      return {
        ...delivery,
        orders: orders,
      };
    });

    return responseData;
  }

  async getDelivery(id: string): Promise<GetDeliveryDto> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        DeliveryStatusHistory: true,
        orders: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    lastName: true,
                    firstName: true,
                    phoneNumber: true,
                    photoUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (delivery === null) {
      throw new NotFoundException('Delivery not found');
    }
    return {
      ...delivery,
      orders: delivery.orders.map((order) => ({
        ...order,
        studentInfo: order.student.user,
        student: undefined,
      })),
    };
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

  async updateDeliveryStatus(id: string, updateStatusDto: UpdateStatusDto) {
    const { status, reason } = updateStatusDto;
    if (status === DeliveryStatus.CANCELED && !reason) {
      throw new BadRequestException('Reason is required when canceling a delivery');
    }

    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        orders: true,
      },
    });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (status === DeliveryStatus.CANCELED) {
      if (
        delivery.orders.some(
          (order) =>
            order.latestStatus === OrderStatus.CANCELED ||
            order.latestStatus === OrderStatus.DELIVERED
        )
      ) {
        throw new BadRequestException(
          'Delivery cannot be canceled because one or more orders are already canceled or delivered'
        );
      } else {
        await this.notificationService.sendNotification({
          type: 'DELIVERY',
          title: 'Thay đổi trạng thái chuyến đi',
          content: 'Chuyến đi đã bị hủy',
          deliveryId: delivery.id,
          orderId: undefined,
          reportId: undefined,
          userId: delivery.staffId,
        });
        await Promise.all(
          delivery.orders.map((order) =>
            createOrderStatusHistory(this.prisma, order.id, OrderStatus.CANCELED, reason)
          )
        );
        return this.prisma.delivery.update({
          where: { id },
          data: {
            DeliveryStatusHistory: {
              create: {
                status,
                time: this.dateService.getCurrentUnixTimestamp().toString(),
                reason,
              },
            },
          },
        });
      }
    }

    await this.notificationService.sendNotification({
      type: 'DELIVERY',
      title: 'Thay đổi trạng thái chuyến đi',
      content: status === 'FINISHED' ? 'Chuyến đi đã hoàn thành' : 'Chuyến đi đang vận chuyển',
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
            reason,
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
