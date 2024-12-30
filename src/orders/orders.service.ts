import {
  BadRequestException,
  Injectable,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { PageResponseDto } from 'src/common/dtos/page-response.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PrismaService } from 'src/prisma';
import { GetUserType } from 'src/types';

import {
  CreateAdminOrderDto,
  CreateStudentOrderDto,
  OrderCancelReason,
  OrderQueryDto,
  StaffOrdersStatsDto,
  StudentOrdersStatsDto,
  UpdateStatusDto,
} from './dtos';
import { GetOrderResponseDto } from './dtos/response.dto';
import { ShippingFeeDto } from './dtos/shippingFee.dto';
import {
  convertToUnixTimestamp,
  createOrderStatusHistory,
  findExistingOrder,
  getHistoryTimee,
  getLatestOrderStatus,
  getShippingFee,
  shortenUUID,
  validateUserForOrder,
} from './utils/order.util';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationsService
  ) {}

  async getOrders(
    query: OrderQueryDto,
    user: GetUserType
  ): Promise<PageResponseDto<GetOrderResponseDto>> {
    const { page, size, search, status, isPaid, sortBy, sortOrder, startDate, endDate } = query;

    const where: any = {};
    if (user.role === 'STUDENT') {
      where.studentId = user.id;
    }
    if (search) {
      where.OR = [
        { checkCode: { contains: search, mode: 'insensitive' } },
        { product: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.latestStatus = status;
    }
    if (isPaid !== undefined) {
      where.isPaid = isPaid;
    }
    if (startDate) {
      where.deliveryDate = {
        gte: convertToUnixTimestamp(startDate),
      };
    }
    if (endDate) {
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.deliveryDate = {
        ...where.deliveryDate,
        lte: convertToUnixTimestamp(nextDay.toISOString().split('T')[0]),
      };
    }

    const orderBy: any[] = [];
    if (sortBy) {
      orderBy.push({
        [sortBy]: sortOrder || 'asc',
      });
    }

    const [orders, totalElements] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy,
      }),
      this.prisma.order.count({ where }),
    ]);

    const ordersWithStatus = await Promise.all(
      orders.map(async (order) => {
        const latestStatus = await getLatestOrderStatus(this.prisma, order.id);
        const historyTime = await getHistoryTimee(this.prisma, order.id);
        if (order.shipperId) {
          const staff = await this.prisma.user.findUnique({ where: { id: order.shipperId } });
          return {
            ...order,
            latestStatus,
            historyTime,
            staffInfo: {
              lastName: staff.lastName,
              firstName: staff.firstName,
              phoneNumber: staff.phoneNumber,
              photoUrl: staff.photoUrl,
            },
          };
        }
        return {
          ...order,
          latestStatus,
          historyTime,
        };
      })
    );

    const totalPages = Math.ceil(totalElements / size);

    return {
      totalElements,
      totalPages,
      results: ordersWithStatus,
    };
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
    const { checkCode, brand } = createOrderDto;

    if (user.role === 'STUDENT') {
      validateUserForOrder(user, createOrderDto, 'STUDENT');

      const existingOrder = await findExistingOrder(this.prisma, checkCode, brand);
      if (existingOrder) {
        // This case is when student create order that has been created by admin
        if (
          !existingOrder.studentId &&
          !existingOrder.deliveryDate &&
          !existingOrder.room &&
          !existingOrder.building &&
          !existingOrder.dormitory
        ) {
          const amount = getShippingFee(
            (createOrderDto as CreateStudentOrderDto).room,
            (createOrderDto as CreateStudentOrderDto).building,
            (createOrderDto as CreateStudentOrderDto).dormitory,
            (createOrderDto as CreateStudentOrderDto).weight
          );
          await this.prisma.order.update({
            where: { id: existingOrder.id },
            data: {
              studentId: user.id,
              shippingFee: amount,
              deliveryDate: convertToUnixTimestamp(
                (createOrderDto as CreateStudentOrderDto).deliveryDate
              ),
              room: (createOrderDto as CreateStudentOrderDto).room,
              building: (createOrderDto as CreateStudentOrderDto).building,
              dormitory: (createOrderDto as CreateStudentOrderDto).dormitory,
              remainingAmount: amount,
            },
          });
          await this.updateStatus(
            existingOrder.id,
            {
              status: 'ACCEPTED',
            },
            user
          );
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
        // This case is when student create order that has been created by another student
        else if (existingOrder.studentId && existingOrder.studentId !== user.id) {
          throw new UnauthorizedException(
            'Đơn hàng này đã thuộc về người khác, bạn không thể tạo đơn hàng này'
          );
        } else {
          throw new BadRequestException('Bạn đã tạo đơn hàng này rồi!');
        }
      }
      const amount = getShippingFee(
        (createOrderDto as CreateStudentOrderDto).room,
        (createOrderDto as CreateStudentOrderDto).building,
        (createOrderDto as CreateStudentOrderDto).dormitory,
        (createOrderDto as CreateStudentOrderDto).weight
      );
      const newOrder = await this.prisma.order.create({
        data: {
          ...(createOrderDto as CreateStudentOrderDto),
          studentId: user.id,
          latestStatus: 'PENDING',
          deliveryDate: convertToUnixTimestamp(
            (createOrderDto as CreateStudentOrderDto).deliveryDate
          ),
          shippingFee: amount,
          remainingAmount: amount,
        },
      });
      await createOrderStatusHistory(this.prisma, newOrder.id, 'PENDING');
      const historyTime = await getHistoryTimee(this.prisma, newOrder.id);
      await this.notificationService.sendPushNotification({
        userId: user.id,
        message: {
          title: 'Tạo đơn hàng thành công',
          message: `Đơn hàng ${shortenUUID(newOrder.checkCode, 'ORDER')} của bạn đã được tạo thành công. Vui lòng chờ admin xác nhận`,
        },
      });
      return {
        message: 'Order created and status set to PENDING',
        data: {
          ...newOrder,
          historyTime,
        },
      };
    } else if (user.role === 'ADMIN') {
      validateUserForOrder(user, createOrderDto, 'ADMIN');

      const existingOrder = await findExistingOrder(this.prisma, checkCode, brand);

      if (existingOrder) {
        // Check for existing order previously created by admin or not
        if (
          !existingOrder.deliveryDate &&
          !existingOrder.room &&
          !existingOrder.building &&
          !existingOrder.dormitory
        ) {
          throw new BadRequestException('Đơn hàng này đã được tạo trước đó từ quản trị viên!');
        }
        await this.updateStatus(
          existingOrder.id,
          {
            status: 'ACCEPTED',
          },
          user
        );
        await createOrderStatusHistory(this.prisma, existingOrder.id, 'ACCEPTED');
        await this.notificationService.sendNotification({
          type: 'ORDER',
          title: 'Xác nhận đơn hàng',
          content: `Đơn hàng Đơn hàng ${shortenUUID(existingOrder.checkCode, 'ORDER')} của bạn đã được xác nhận`,
          orderId: existingOrder.id,
          userId: existingOrder.studentId,
          deliveryId: undefined,
          reportId: undefined,
        });

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
          ...(createOrderDto as CreateAdminOrderDto),
          latestStatus: 'PENDING',
        },
      });
      await createOrderStatusHistory(this.prisma, newOrder.id, 'PENDING');
      const historyTime = await getHistoryTimee(this.prisma, newOrder.id);
      return {
        message: 'Order created and status set to PENDING',
        data: {
          ...newOrder,
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

  async updateStatus(id: string, updateStatusDto: UpdateStatusDto, user: GetUserType) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    const { status, canceledImage, reason, finishedImage, distance, cancelReasonType } =
      updateStatusDto;
    // Check if staff already in the acceptable zone of finish order
    if (status === 'DELIVERED' && distance && distance < 150) {
      throw new BadRequestException(
        'Bạn cần phải ở trong vùng hoàn thành đơn hàng, tối thiểu 150m'
      );
    }
    // Check if staff has already captured the image of the order when delivering
    if (status === 'DELIVERED' && !finishedImage) {
      throw new BadRequestException('Cần phải có hình ảnh khi giao hàng');
    }

    if (status === 'CANCELED') {
      this.handleCancelDelivery(cancelReasonType, canceledImage, reason);
    }
    // For staff update status of order to DELIVERED and payment method is CASH
    if (user.role === 'STAFF' && status === 'DELIVERED' && order.paymentMethod === 'CASH') {
      await this.prisma.order.update({
        where: { id },
        data: {
          isPaid: true,
        },
      });
    }

    await this.notificationService.sendNotification({
      type: 'ORDER',
      title: 'Thay đổi trạng thái đơn hàng',
      content: `Đơn hàng ${shortenUUID(order.checkCode, 'ORDER')} của bạn đã chuyển sang trạng thái ${status === 'CANCELED' ? 'Bị Hủy' : status === 'DELIVERED' ? 'Đã Giao' : status === 'REJECTED' ? 'Bị Từ Chối' : status === 'ACCEPTED' ? 'Xác nhận' : status === 'PENDING' ? 'Đang chờ xử lý' : 'Đang vận chuyển'}`,
      orderId: order.id,
      userId: order.studentId,
      deliveryId: undefined,
      reportId: undefined,
    });
    await this.notificationService.sendPushNotification({
      userId: order.studentId,
      message: {
        title: 'Thay đổi trạng thái đơn hàng',
        message: `Đơn hàng ${shortenUUID(order.checkCode, 'ORDER')} của bạn đã chuyển sang trạng thái ${status === 'CANCELED' ? 'Bị Hủy' : status === 'DELIVERED' ? 'Đã Giao' : status === 'REJECTED' ? 'Bị Từ Chối' : status === 'ACCEPTED' ? 'Xác nhận' : status === 'PENDING' ? 'Đang chờ xử lý' : 'Đang vận chuyển'}`,
        body: {
          type: 'ORDER',
          orderId: order.id,
        },
      },
    });
    await createOrderStatusHistory(
      this.prisma,
      id,
      status,
      canceledImage,
      this.mapTypeToReason(cancelReasonType, reason),
      finishedImage
    );
    return { message: 'Order status updated' };
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

  async getShippingFee(query: ShippingFeeDto) {
    const { weight, room, building, dormitory } = query;
    if (!weight || !room || !building || !dormitory) {
      throw new BadRequestException('Missing required fields');
    }
    const shippingFee = getShippingFee(room, building, dormitory, weight);
    return { shippingFee };
  }

  async getOrdersStats(
    type: 'week' | 'month' | 'year',
    user: GetUserType
  ): Promise<StaffOrdersStatsDto | StudentOrdersStatsDto> {
    if (user.role === 'ADMIN') {
      throw new NotImplementedException();
    }
    if (user.role === 'STAFF') {
      return this.getOrdersStatsForStaff(type, user);
    }
    return this.getOrdersStatsForStudent(user);
  }

  private async getOrdersStatsForStaff(
    type: 'week' | 'month' | 'year',
    user: GetUserType
  ): Promise<StaffOrdersStatsDto> {
    const now = Math.floor(Date.now() / 1000);
    let startTime: number;

    switch (type) {
      case 'week':
        startTime = now - 7 * 24 * 60 * 60;
        break;
      case 'month':
        startTime = now - 30 * 24 * 60 * 60;
        break;
      case 'year':
        startTime = now - 365 * 24 * 60 * 60;
        break;
      default:
        throw new BadRequestException('Invalid type');
    }

    const stats = await this.prisma.order.aggregate({
      _count: true,
      _sum: {
        shippingFee: true,
      },
      where: {
        shipperId: user.id,
        deliveryDate: {
          gte: startTime.toString(),
        },
      },
    });
    console.log('Stats: ', stats);

    const totalOrders = await this.prisma.order.count({
      where: {
        shipperId: user.id,
        deliveryDate: {
          gte: startTime.toString(),
        },
      },
    });
    let brandPercentages = [];
    if (totalOrders > 0) {
      // Group orders by brand and calculate counts
      const ordersByBrand = await this.prisma.order.groupBy({
        by: ['brand'],
        _count: {
          brand: true,
        },
        where: {
          shipperId: user.id,
          deliveryDate: {
            gte: startTime.toString(),
          },
        },
      });

      // Calculate percentage for each brand
      brandPercentages = ordersByBrand.map((entry) => ({
        brand: entry.brand || 'Unknown',
        count: entry._count.brand,
        percentage: ((entry._count.brand / totalOrders) * 100).toFixed(2),
      }));
    }

    return {
      totalOrders: stats._count || 0,
      totalShippingFee: stats._sum.shippingFee || 0,
      brandPercentages,
    };
  }

  private async getOrdersStatsForStudent(user: GetUserType): Promise<StudentOrdersStatsDto> {
    const now = Math.floor(Date.now() / 1000);
    const lastWeek = now - 7 * 24 * 60 * 60;
    const lastMonth = now - 30 * 24 * 60 * 60;

    const [totalOrdersLastWeek, totalOrdersLastMonth, totalOrders] = await this.prisma.$transaction(
      [
        this.prisma.order.count({
          where: {
            studentId: user.id,
            deliveryDate: {
              gte: lastWeek.toString(),
            },
          },
        }),
        this.prisma.order.count({
          where: {
            studentId: user.id,
            deliveryDate: {
              gte: lastMonth.toString(),
            },
          },
        }),
        this.prisma.order.count({
          where: {
            shipperId: user.id,
          },
        }),
      ]
    );

    let brandPercentages = [];
    if (totalOrders > 0) {
      // Group orders by brand and calculate counts
      const ordersByBrand = await this.prisma.order.groupBy({
        by: ['brand'],
        _count: {
          brand: true,
        },
        where: {
          shipperId: user.id,
        },
      });

      // Calculate percentage for each brand
      brandPercentages = ordersByBrand.map((entry) => ({
        brand: entry.brand || 'Unknown',
        count: entry._count.brand,
        percentage: ((entry._count.brand / totalOrders) * 100).toFixed(2),
      }));
    }

    return {
      totalOrdersLastWeek,
      totalOrdersLastMonth,
      brandPercentages,
    };
  }

  handleCancelDelivery = (
    cancelReasonType?: OrderCancelReason,
    canceledImage?: string,
    reason?: string
  ) => {
    if (!cancelReasonType) {
      throw new BadRequestException('Cần phải có lý do khi hủy chuyến đi');
    }
    if (cancelReasonType === OrderCancelReason.OTHER && !reason) {
      throw new BadRequestException('Cần phải có lý do khi chọn lý do hủy là khác');
    }
    if (
      !(cancelReasonType in [OrderCancelReason.PERSONAL_REASON, OrderCancelReason.OTHER]) &&
      !canceledImage
    ) {
      throw new BadRequestException(
        'Cần phải có hình ảnh khi chọn lý do hủy không phải là lý do cá nhân'
      );
    }
  };
  mapTypeToReason = (cancelReasonType: OrderCancelReason, reason?: string) => {
    switch (cancelReasonType) {
      case OrderCancelReason.WRONG_ADDRESS:
        return 'Sai địa chỉ';
      case OrderCancelReason.CAN_NOT_CONTACT:
        return 'Không liên lạc được';
      case OrderCancelReason.PAYMENT_ISSUE:
        return 'Vấn đề thanh toán';
      case OrderCancelReason.DAMAGED_PRODUCT:
        return 'Sản phẩm bị hỏng';
      case OrderCancelReason.HEAVY_PRODUCT:
        return 'Sản phẩm quá nặng';
      case OrderCancelReason.PERSONAL_REASON:
        return 'Lý do cá nhân';
      case OrderCancelReason.DAMEGED_VEHICLE:
        return 'Xe hỏng';
      case OrderCancelReason.OTHER:
        return reason;
      default:
        return 'Khác';
    }
  };
}
