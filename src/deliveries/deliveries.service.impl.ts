import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Delivery, DeliveryStatus, OrderStatus } from '@prisma/client';
import { DateService } from 'src/date';
import { IdGeneratorService } from 'src/id-generator';
import { NotificationsService } from 'src/notifications/notifications.service';
import { OrderCancelType } from 'src/orders/dtos';
import { createOrderStatusHistory, mapReason, shortenUUID } from 'src/orders/utils/order.util';
import { PrismaService } from 'src/prisma';
import { GetUserType } from 'src/types';

import { DeliveriesService } from './deliveries.service';
import {
  CreateDeliveryDto,
  GetDeliveriesDto,
  GetDeliveryDto,
  UpdateDeliveryDto,
  UpdateStatusDto,
} from './dtos';

@Injectable()
export class DeliveriesServiceImpl extends DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dateService: DateService,
    private readonly notificationService: NotificationsService,
    private readonly idGeneratorService: IdGeneratorService
  ) {
    super();
  }

  override async createDelivery(createDeliveryDto: CreateDeliveryDto): Promise<Delivery> {
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
        (order) =>
          order.deliveries.length > 0 && order.latestStatus !== OrderStatus.RECEIVED_EXTERNAL
      )
    ) {
      throw new BadRequestException('One or more orders have not received from external first');
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
      await this.notificationService.sendFullNotification({
        type: 'DELIVERY',
        title: 'Chuyến đi mới vừa được tạo',
        message: `Chuyến đi ${newDelivery.displayId} đã được tạo`,
        deliveryId: newDelivery.id,
        orderId: undefined,
        reportId: undefined,
        userId: deliveryData.staffId,
      });
    }
    return newDelivery;
  }

  override async getDeliveries(user: GetUserType): Promise<GetDeliveriesDto[]> {
    return await this.prisma.delivery.findMany({
      where: user.role === 'ADMIN' ? {} : { staffId: user.id },
    });
  }

  override async getDelivery(id: string): Promise<GetDeliveryDto> {
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

  override async updateDelivery(
    id: string,
    updateDeliveryDto: UpdateDeliveryDto
  ): Promise<Delivery> {
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

  override async updateDeliveryStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
    user: GetUserType
  ): Promise<Delivery> {
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

      const inTransportOrders = delivery.orders.filter(
        (ordersOnDelivery) => ordersOnDelivery.order.latestStatus === 'IN_TRANSPORT'
      );

      // Cập nhật trạng thái và gửi noti song song cho từng đơn
      await Promise.all(
        inTransportOrders.map(async (ordersOnDelivery) => {
          await createOrderStatusHistory(
            this.prisma,
            ordersOnDelivery.orderId,
            OrderStatus.CANCELED,
            mapReason(OrderCancelType.FROM_STAFF, reason),
            canceledImage
          );

          await this.notificationService.sendFullNotification({
            type: 'ORDER',
            title: 'Đơn hàng bị hủy',
            message: `Đơn hàng ${shortenUUID(ordersOnDelivery.order.checkCode, 'ORDER')} đã bị hủy vì: ${reason}`,
            deliveryId: delivery.id,
            orderId: ordersOnDelivery.orderId,
            reportId: undefined,
            userId: ordersOnDelivery.order.studentId,
          });
        })
      );

      // Gửi noti cho shipper
      await this.notificationService.sendFullNotification({
        type: 'DELIVERY',
        title: 'Thay đổi trạng thái chuyến đi',
        message: `Chuyến đi ${delivery.displayId} đã bị hủy, lý do: ${reason}`,
        deliveryId: delivery.id,
        orderId: undefined,
        reportId: undefined,
        userId: delivery.staffId,
      });

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

    if (status === DeliveryStatus.PENDING || status === DeliveryStatus.ACCEPTED) {
      if (reason || canceledImage) {
        throw new ConflictException(
          'Không thể cập nhật lí do hoặc hình ảnh huỷ cho trạng thái của chuyến đi này'
        );
      }
    }

    if (status === DeliveryStatus.ACCEPTED) {
      await Promise.all(
        delivery.orders.map((order) =>
          createOrderStatusHistory(this.prisma, order.orderId, OrderStatus.IN_TRANSPORT)
        )
      );
    }

    const isAllOrdersCanceled = delivery.orders.every(
      (orderOnDelivery) => orderOnDelivery.order.latestStatus === OrderStatus.CANCELED
    );
    if (isAllOrdersCanceled && (!reason || !canceledImage)) {
      throw new BadRequestException('Cần phải có lí do hoặc hình ảnh minh chứng khi huỷ chuyến đi');
    }

    let title = '';
    let message = '';

    if (status === 'PENDING') {
      title = 'Chuyến đi đang chờ nhận';
      message = `Chuyến đi ${delivery.displayId} đang chờ shipper nhận`;
    } else if (status === 'ACCEPTED') {
      title = 'Chuyến đi đã được nhận';
      message = `Chuyến đi ${delivery.displayId} đã được shipper nhận`;
    } else if (status === 'FINISHED') {
      title = 'Chuyến đi đã hoàn thành';
      message = `Chuyến đi ${delivery.displayId} đã hoàn thành`;
    }

    await this.notificationService.sendFullNotification({
      type: 'DELIVERY',
      title,
      message,
      deliveryId: delivery.id,
      orderId: undefined,
      reportId: undefined,
      userId: delivery.staffId,
    });

    return this.prisma.delivery.update({
      where: { id },
      data: {
        DeliveryStatusHistory: {
          create: {
            status: isAllOrdersCanceled ? DeliveryStatus.CANCELED : status,
            time: this.dateService.getCurrentUnixTimestamp().toString(),
            reason,
            canceledImage,
          },
        },
        latestStatus: isAllOrdersCanceled ? DeliveryStatus.CANCELED : status,
      },
    });
  }

  override async deleteDelivery(id: string): Promise<Delivery> {
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
