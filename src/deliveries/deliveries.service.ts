import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryStatus, OrderStatus } from '@prisma/client';
import { DateService } from 'src/date';
import { IdGeneratorService } from 'src/id-generator';
import { NotificationsService } from 'src/notifications/notifications.service';
import { OrderCancelType } from 'src/orders/dtos';
import { createOrderStatusHistory, mapReason, shortenUUID } from 'src/orders/utils/order.util';
import { PrismaService } from 'src/prisma';
import { GetUserType } from 'src/types';

import {
  CreateDeliveryDto,
  GetDeliveriesDto,
  GetDeliveryDto,
  UpdateDeliveryDto,
  UpdateStatusDto,
} from './dtos';

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dateService: DateService,
    private readonly notificationService: NotificationsService,
    private readonly idGeneratorService: IdGeneratorService
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
    const displayId = await this.idGeneratorService.generateUniqueId(
      'delivery',
      'displayId',
      'DEL'
    );
    // update field attribute shipperId in each order of orders
    const newDelivery = await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        orders.map((order) =>
          tx.order.update({
            where: { id: order.id },
            data: {
              shipperId: deliveryData.staffId,
            },
          })
        )
      );

      const createdDelivery = await tx.delivery.create({
        data: {
          ...deliveryData,
          displayId,
          createdAt,
          DeliveryStatusHistory: {
            create: {
              status: DeliveryStatus.PENDING,
              time: createdAt,
            },
          },
          latestStatus: DeliveryStatus.PENDING,
          orders: {
            createMany: {
              data: orderIds.map((orderId, index) => ({
                orderId,
                orderSequence: index + 1,
              })),
            },
          },
          numberOrder: orderIds.length,
        },
      });
      return createdDelivery;
    });

    if (deliveryData.staffId) {
      await this.notificationService.sendNotification({
        type: 'DELIVERY',
        title: 'Chuyến đi mới vừa được tạo',
        content: `Chuyến đi ${shortenUUID(newDelivery.id, 'DELIVERY')} đã được tạo`,
        deliveryId: newDelivery.id,
        orderId: undefined,
        reportId: undefined,
        userId: deliveryData.staffId,
      });
    }
    return newDelivery;
  }

  async getDeliveries(user: GetUserType): Promise<GetDeliveriesDto[]> {
    return await this.prisma.delivery.findMany({
      where: user.role === 'ADMIN' ? {} : { staffId: user.id },
    });
  }

  async getDelivery(id: string): Promise<GetDeliveryDto> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        DeliveryStatusHistory: true,
        orders: {
          include: {
            order: {
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
        },
      },
    });

    if (delivery === null) {
      throw new NotFoundException('Delivery not found');
    }
    return {
      ...delivery,
      orders: delivery.orders
        .sort((a, b) => a.orderSequence - b.orderSequence)
        .map((ordersOnDelivery) => {
          const { order } = ordersOnDelivery;
          return {
            ...order,
            studentInfo: order.student?.user,
            student: undefined,
          };
        }),
    };
  }

  async updateDelivery(id: string, updateDeliveryDto: UpdateDeliveryDto) {
    const { orderIds, ...deliveryData } = updateDeliveryDto;

    // Check existence and status of delivery
    const delivery = await this.prisma.delivery.findUnique({ where: { id } });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.latestStatus !== DeliveryStatus.PENDING) {
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
          createMany: {
            data: orderIds.map((orderId, index) => ({
              orderId,
              orderSequence: index + 1,
            })),
          },
        },
      },
    });

    return updatedDelivery;
  }

  async updateDeliveryStatus(id: string, updateStatusDto: UpdateStatusDto, user: GetUserType) {
    // Check if the staff is going to deliver another delivery
    const isGoingDelivery = await this.prisma.delivery.findFirst({
      where: { staffId: user.id, latestStatus: DeliveryStatus.ACCEPTED },
    });
    if (isGoingDelivery && updateStatusDto.status === DeliveryStatus.ACCEPTED) {
      throw new BadRequestException('Bạn chỉ có thể nhận một chuyến đi tại một thời điểm');
    }
    const { status, reason, canceledImage } = updateStatusDto;

    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            order: true,
          },
        },
      },
    });
    if (!delivery) {
      throw new NotFoundException('Không tìm thấy chuyến đi');
    }

    if (status === DeliveryStatus.CANCELED) {
      if (!reason || !canceledImage) {
        throw new BadRequestException(
          'Cần phải có lí do hoặc hình ảnh minh chứng khi huỷ chuyến đi'
        );
      }

      await this.notificationService.sendNotification({
        type: 'DELIVERY',
        title: 'Thay đổi trạng thái chuyến đi',
        content: `Chuyến đi ${shortenUUID(delivery.id, 'DELIVERY')} đã bị hủy, lý do: ${reason}`,
        deliveryId: delivery.id,
        orderId: undefined,
        reportId: undefined,
        userId: delivery.staffId,
      });
      await Promise.all(
        delivery.orders.map((ordersOnDelivey) =>
          createOrderStatusHistory(
            this.prisma,
            ordersOnDelivey.orderId,
            OrderStatus.CANCELED,
            mapReason(OrderCancelType.FROM_STAFF, reason),
            canceledImage
          )
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
              canceledImage,
            },
          },
          latestStatus: status,
        },
      });
    }

    await this.notificationService.sendNotification({
      type: 'DELIVERY',
      title: 'Thay đổi trạng thái chuyến đi',
      content:
        status === 'FINISHED'
          ? `Chuyến đi ${shortenUUID(delivery.id, 'DELIVERY')} đã hoàn thành`
          : `Chuyến đi ${shortenUUID(delivery.id, 'DELIVERY')} đã được nhận`,
      deliveryId: delivery.id,
      orderId: undefined,
      reportId: undefined,
      userId: delivery.staffId,
    });

    if (status === DeliveryStatus.ACCEPTED) {
      await Promise.all(
        delivery.orders.map((order) =>
          createOrderStatusHistory(this.prisma, order.orderId, OrderStatus.IN_TRANSPORT)
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
        latestStatus: status,
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
