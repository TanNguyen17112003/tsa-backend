import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryStatus, OrderStatus } from '@prisma/client';
import { DateService } from 'src/date';
import { NotificationsService } from 'src/notifications/notifications.service';
import { createOrderStatusHistory, shortenUUID } from 'src/orders/utils/order.util';
import { PrismaService } from 'src/prisma';
import { GetUserType } from 'src/types';

import {
  CreateDeliveryDto,
  DeliveryCancelReason,
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
        latestStatus: DeliveryStatus.PENDING,
        orders: {
          connect: orderIds.map((id) => ({ id })),
        },
        numberOrder: orderIds.length,
      },
    });
    await this.notificationService.sendNotification({
      type: 'DELIVERY',
      title: 'Chuyến đi mới vừa được tạo',
      content: `Chuyến đi ${shortenUUID(newDelivery.id, 'DELIVERY')} đã được tạo`,
      deliveryId: newDelivery.id,
      orderId: undefined,
      reportId: undefined,
      userId: deliveryData.staffId,
    });
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
          set: orderIds.map((id) => ({ id })),
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
    const { status, reason, canceledImage, cancelReasonType } = updateStatusDto;

    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        orders: true,
      },
    });
    if (!delivery) {
      throw new NotFoundException('Không tìm thấy chuyến đi');
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
          'Chuyến đi không thể bị hủy khi có ít nhất một đơn hàng đã được hủy hoặc đã được giao'
        );
      } else {
        this.handleCancelDelivery(cancelReasonType, canceledImage, reason);

        await this.notificationService.sendNotification({
          type: 'DELIVERY',
          title: 'Thay đổi trạng thái chuyến đi',
          content: `Chuyến đi ${shortenUUID(delivery.id, 'DELIVERY')} đã bị hủy, lý do: ${this.mapTypeToReason(cancelReasonType)}`,
          deliveryId: delivery.id,
          orderId: undefined,
          reportId: undefined,
          userId: delivery.staffId,
        });
        await Promise.all(
          delivery.orders.map((order) =>
            createOrderStatusHistory(
              this.prisma,
              order.id,
              OrderStatus.CANCELED,
              this.mapTypeToReason(cancelReasonType, reason),
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
                reason: this.mapTypeToReason(cancelReasonType),
                canceledImage,
              },
            },
            latestStatus: status,
          },
        });
      }
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

  handleCancelDelivery = (
    cancelReasonType?: DeliveryCancelReason,
    canceledImage?: string,
    reason?: string
  ) => {
    if (!cancelReasonType) {
      throw new BadRequestException('Cần phải có lý do khi hủy chuyến đi');
    }
    if (cancelReasonType === DeliveryCancelReason.OTHER && !reason) {
      throw new BadRequestException('Cần phải có lý do khi chọn lý do hủy là khác');
    }
    if (cancelReasonType === DeliveryCancelReason.DAMEGED_VEHICLE && !canceledImage) {
      throw new BadRequestException(
        'Cần phải có hình ảnh khi chọn lý do hủy là hỏng phương tiện giao hàng'
      );
    }
  };
  mapTypeToReason = (cancelReasonType: DeliveryCancelReason, reason?: string) => {
    switch (cancelReasonType) {
      case DeliveryCancelReason.DAMEGED_VEHICLE:
        return 'Phương tiện giao hàng bị hỏng';
      case DeliveryCancelReason.PERSONAL_REASON:
        return 'Lý do cá nhân';
      case DeliveryCancelReason.OTHER:
        return reason;
      default:
        return 'Khác';
    }
  };
}
