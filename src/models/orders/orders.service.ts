import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { $Enums } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetUserType } from 'src/types';

import { CreateAdminOrderDto, CreateStudentOrderDto } from './dtos/create.dto';
import { OrderQueryDto } from './dtos/query.dto';
import { OrderEntity } from './entity/order.entity';
import {
  convertToUnixTimestamp,
  createOrderStatusHistory,
  findExistingOrder,
  getHistoryTimee,
  getLatestOrderStatus,
  validateUserForOrder,
} from './utils/order.util';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrders(query: OrderQueryDto, user: GetUserType): Promise<OrderEntity[]> {
    const { skip, take, order, sortBy } = query;

    const orders = await this.prisma.order.findMany({
      ...(skip ? { skip: +skip } : null),
      ...(take ? { take: +take } : null),
      ...(sortBy ? { orderBy: { [sortBy]: order || 'asc' } } : null),
      where: user.role === 'STUDENT' ? { studentId: user.id } : {},
    });

    const ordersWithStatus = await Promise.all(
      orders.map(async (order) => {
        const latestStatus = await getLatestOrderStatus(this.prisma, order.id);
        const historyTime = await getHistoryTimee(this.prisma, order.id);
        return {
          ...order,
          latestStatus,
          historyTime,
        };
      })
    );

    return ordersWithStatus;
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    const latestStatus = await getLatestOrderStatus(this.prisma, id);
    const historyTime = await getHistoryTimee(this.prisma, order.id);
    return {
      ...order,
      latestStatus,
      historyTime,
    };
  }

  async createOrder(
    createOrderDto: CreateStudentOrderDto | CreateAdminOrderDto,
    user: GetUserType
  ) {
    const { checkCode, product, weight } = createOrderDto;

    if ('studentId' in createOrderDto) {
      validateUserForOrder(user, createOrderDto, 'STUDENT');

      const existingOrder = await findExistingOrder(this.prisma, checkCode, product, weight);

      if (existingOrder) {
        await this.prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            ...createOrderDto,
            deliveryDate: convertToUnixTimestamp(
              (createOrderDto as CreateStudentOrderDto).deliveryDate
            ),
          },
        });
        await createOrderStatusHistory(this.prisma, existingOrder.id, 'ACCEPTED');
        const historyTime = await getHistoryTimee(this.prisma, existingOrder.id);
        const latestStatus = await getLatestOrderStatus(this.prisma, existingOrder.id);
        return {
          message: 'Order updated and status set to ACCEPTED',
          data: {
            ...existingOrder,
            latestStatus,
            historyTime,
          },
        };
      }

      const newOrder = await this.prisma.order.create({
        data: {
          ...(createOrderDto as CreateStudentOrderDto),
          deliveryDate: convertToUnixTimestamp(
            (createOrderDto as CreateStudentOrderDto).deliveryDate
          ),
        },
      });
      await createOrderStatusHistory(this.prisma, newOrder.id, 'PENDING');
      const historyTime = await getHistoryTimee(this.prisma, newOrder.id);
      const latestStatus = await getLatestOrderStatus(this.prisma, newOrder.id);
      return {
        message: 'Order created and status set to PENDING',
        data: {
          ...newOrder,
          latestStatus,
          historyTime,
        },
      };
    } else if ('adminId' in createOrderDto) {
      validateUserForOrder(user, createOrderDto, 'ADMIN');

      const existingOrder = await findExistingOrder(this.prisma, checkCode, product, weight);

      if (existingOrder) {
        await createOrderStatusHistory(this.prisma, existingOrder.id, 'ACCEPTED');
        const historyTime = await getHistoryTimee(this.prisma, existingOrder.id);
        const latestStatus = await getLatestOrderStatus(this.prisma, existingOrder.id);
        return {
          message: 'Order updated and status set to ACCEPTED',
          data: {
            ...existingOrder,
            latestStatus,
            historyTime,
          },
        };
      }

      const newOrder = await this.prisma.order.create({
        data: createOrderDto as CreateAdminOrderDto,
      });
      await createOrderStatusHistory(this.prisma, newOrder.id, 'PENDING');
      const historyTime = await getHistoryTimee(this.prisma, newOrder.id);
      const latestStatus = await getLatestOrderStatus(this.prisma, newOrder.id);
      return {
        message: 'Order created and status set to PENDING',
        data: {
          ...newOrder,
          latestStatus,
          historyTime,
        },
      };
    } else {
      throw new BadRequestException('Invalid order creation request');
    }
  }

  async updateOrderInfo(
    id: string,
    updateOrderDto: CreateStudentOrderDto | CreateAdminOrderDto,
    user: GetUserType
  ) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    const latestOrderStatus = await this.prisma.orderStatusHistory.findFirst({
      where: { orderId: id },
      orderBy: { time: 'desc' },
    });
    if (!order) {
      throw new BadRequestException('Order not found');
    }

    validateUserForOrder(user, order, user.role);

    if (latestOrderStatus.status !== 'PENDING') {
      throw new UnauthorizedException('You can only update orders that are pending');
    }

    await this.prisma.order.update({
      where: { id },
      data: {
        ...updateOrderDto,
        deliveryDate: convertToUnixTimestamp(
          (updateOrderDto as CreateStudentOrderDto).deliveryDate
        ),
      },
    });
    const latestStatus = await getLatestOrderStatus(this.prisma, id);
    const historyTime = await getHistoryTimee(this.prisma, order.id);
    return { message: 'Order updated', data: { ...order, latestStatus, historyTime } };
  }

  async updateStatus(id: string, status: $Enums.OrderStatus, _: GetUserType) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    await createOrderStatusHistory(this.prisma, id, status);
  }

  async deleteOrder(id: string, user: GetUserType) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    const latestOrderStatus = await this.prisma.orderStatusHistory.findFirst({
      where: { orderId: id },
      orderBy: { time: 'desc' },
    });
    if (!order) {
      throw new BadRequestException('Order not found');
    }

    validateUserForOrder(user, order, user.role);

    if (
      user.role === 'STUDENT' &&
      latestOrderStatus.status !== 'REJECTED' &&
      latestOrderStatus.status !== 'PENDING'
    ) {
      throw new UnauthorizedException('You can only delete orders that are pending or rejected');
    }

    await this.prisma.order.delete({ where: { id } });
    return { message: 'Order deleted' };
  }
}
