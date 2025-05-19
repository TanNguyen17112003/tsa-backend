import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { Order, OrderStatus } from '@prisma/client';
import { MessageResponseDto } from 'src/common/dtos/message-response.dto';
import { PageResponseDto } from 'src/common/dtos/page-response.dto';
import { DateService } from 'src/date';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PrismaService } from 'src/prisma';
import { GroupOrdersResponseDto, RouteOrdersResponseDto } from 'src/python-api/python-api.dto';
import { PythonApiService } from 'src/python-api/python-api.service';
import { GetUserType } from 'src/types';

import {
  CreateAdminOrderDto,
  CreateOrderResponseDto,
  CreateStudentOrderDto,
  OrderCancelType,
  OrderQueryDto,
  StaffOrdersStatsDto,
  StudentOrdersStatsDto,
  UpdateStatusDto,
} from './dtos';
import { DelayOrdersDto } from './dtos/delay.dto';
import { GroupOrdersDto } from './dtos/group.dto';
import { GetOrderResponseDto } from './dtos/response.dto';
import { RouteOrdersDto } from './dtos/route.dto';
import { ShippingFeeDto } from './dtos/shippingFee.dto';
import { OrderService } from './orders.service';
import {
  convertToUnixTimestamp,
  createOrderStatusHistory,
  findExistingOrder,
  getCancelPermission,
  getHistoryTimee,
  getLatestOrderStatus,
  getShippingFee,
  mapReason,
  shortenUUID,
  validateUserForOrder,
} from './utils/order.util';

@Injectable()
export class OrderServiceImpl extends OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationsService,
    private readonly pythonApi: PythonApiService,
    private readonly dateService: DateService
  ) {
    super();
  }

  override async getOrders(
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

  override async getOrder(id: string): Promise<GetOrderResponseDto> {
    const order = await this.prisma.order.findUnique({ where: { id } });
    const latestStatus = await getLatestOrderStatus(this.prisma, id);
    const historyTime = await getHistoryTimee(this.prisma, order.id);
    return {
      ...order,
      latestStatus,
      historyTime,
    };
  }

  override async createOrder(
    createOrderDto: CreateStudentOrderDto | CreateAdminOrderDto,
    user: GetUserType
  ): Promise<CreateOrderResponseDto> {
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
      await this.notificationService.sendPushNotification(user.id, {
        title: 'Tạo đơn hàng thành công',
        message: `Đơn hàng ${shortenUUID(newOrder.checkCode, 'ORDER')} của bạn đã được tạo thành công. Vui lòng chờ admin xác nhận`,
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
        await this.notificationService.sendFullNotification({
          type: 'ORDER',
          title: 'Xác nhận đơn hàng',
          message: `Đơn hàng Đơn hàng ${shortenUUID(existingOrder.checkCode, 'ORDER')} của bạn đã được xác nhận`,
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

  override async updateOrderInfo(
    id: string,
    updateOrderDto: CreateStudentOrderDto | CreateAdminOrderDto,
    user: GetUserType
  ): Promise<CreateOrderResponseDto> {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    validateUserForOrder(user, order, user.role);

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

  override async updateStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
    user: GetUserType
  ): Promise<MessageResponseDto> {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    const { status, canceledImage, reason, finishedImage, cancelReasonType, receivedImage } =
      updateStatusDto;

    // Check if staff has already captured the image of the order when delivering
    if (status === 'RECEIVED_EXTERNAL' && !receivedImage) {
      throw new BadRequestException('Cần phải có hình ảnh khi nhận hàng từ bên ngoài');
    }

    if (status === 'DELIVERED' && !finishedImage) {
      throw new BadRequestException('Cần phải có hình ảnh khi giao hàng');
    }

    if (status === 'CANCELED') {
      if (!getCancelPermission(user.role, order.latestStatus)) {
        throw new ForbiddenException('Bạn không có quyền huỷ đơn hàng ở trạng thái này');
      }
      if (!cancelReasonType || !reason) {
        throw new BadRequestException('Cần phải có lý do khi hủy đơn hangf');
      }
      if (!canceledImage) {
        throw new BadRequestException('Cần phải có ảnh minh chứng khi huỷ đơn hàng');
      }
      if (cancelReasonType === OrderCancelType.FROM_STUDENT) {
        const student = await this.prisma.student.findUnique({
          where: {
            studentId: order.studentId,
          },
        });

        if (!student) {
          throw new NotFoundException('Không tìm thấy người dùng');
        }
        const oldFailedCount = student.numberFault;
        const newFailedCount = oldFailedCount + 1;

        const regulation = await this.prisma.dormitoryRegulation.findFirst({
          where: {
            name: student.dormitory,
          },
        });

        const bannedThreshold =
          regulation?.banThreshold || Number(process.env.BANNED_STUDENT_NUMBER);
        const shouldBan = newFailedCount === bannedThreshold;

        await this.prisma.$transaction([
          this.prisma.student.update({
            where: { studentId: student.studentId },
            data: { numberFault: newFailedCount },
          }),
          ...(shouldBan
            ? [
                this.prisma.user.update({
                  where: { id: student.studentId },
                  data: { status: 'BANNED' },
                }),
              ]
            : []),
        ]);
      }
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

    if (order.studentId) {
      await this.notificationService.sendFullNotification({
        type: 'ORDER',
        title: 'Thay đổi trạng thái đơn hàng',
        message: `Đơn hàng ${shortenUUID(order.checkCode, 'ORDER')} của bạn đã chuyển sang trạng thái ${status === 'CANCELED' ? 'Bị Hủy' : status === 'DELIVERED' ? 'Đã Giao' : status === 'REJECTED' ? 'Bị Từ Chối' : status === 'ACCEPTED' ? 'Xác nhận' : status === 'PENDING' ? 'Đang chờ xử lý' : 'Đang vận chuyển'}`,
        userId: order.studentId,
        orderId: order.id,
        deliveryId: undefined,
        reportId: undefined,
      });
    }

    await createOrderStatusHistory(
      this.prisma,
      id,
      status,
      mapReason(cancelReasonType, reason),
      canceledImage,
      finishedImage,
      receivedImage
    );
    return { message: 'Order status updated' };
  }

  override async deleteOrder(id: string, user: GetUserType): Promise<MessageResponseDto> {
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

  override async getShippingFee(query: ShippingFeeDto): Promise<{ shippingFee: number }> {
    const { weight, room, building, dormitory } = query;
    if (!weight || !room || !building || !dormitory) {
      throw new BadRequestException('Missing required fields');
    }
    const shippingFee = getShippingFee(room, building, dormitory, weight);
    return { shippingFee };
  }

  override async getOrdersStats(
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

    const [orders, deliveries] = await Promise.all([
      // Lấy danh sách các đơn hàng 'DELIVERED' trong phạm vi thời gian
      this.prisma.order.findMany({
        where: {
          shipperId: user.id,
          deliveryDate: {
            gte: startTime.toString(), // Chuyển startTime thành string
          },
          latestStatus: 'DELIVERED',
        },
      }),

      // Lấy danh sách các deliveries 'FINISHED' trong phạm vi thời gian
      this.prisma.delivery.findMany({
        where: {
          staffId: user.id,
          latestStatus: 'FINISHED',
          createdAt: {
            gte: startTime.toString(), // Chuyển startTime thành string
          },
        },
      }),
    ]);

    // Tính tổng số đơn hàng và tổng shipping fee từ mảng orders
    const totalOrders = orders.length;
    const totalShippingFee = orders.reduce((sum, order) => sum + (order.shippingFee || 0), 0);

    // Sử dụng reduce để nhóm các đơn hàng theo ngày
    const groupedByDay = orders.reduce((acc, order) => {
      const day = this.dateService.getDateFromUnixTimestamp(Number(order.deliveryDate)); // Chuyển timestamp thành ngày 'YYYY-MM-DD'
      if (!acc[day]) {
        acc[day] = { orderCount: 0, totalShippingFee: 0, deliveryCount: 0 }; // Thêm deliveryCount vào mỗi ngày
      }
      acc[day].orderCount += 1;
      acc[day].totalShippingFee += order.shippingFee || 0;

      return acc;
    }, {});

    // Thêm deliveries vào kết quả nhóm theo ngày
    deliveries.forEach((delivery) => {
      const day = this.dateService.getDateFromUnixTimestamp(Number(delivery.createdAt)); // Chuyển timestamp thành ngày 'YYYY-MM-DD'
      if (!groupedByDay[day]) {
        groupedByDay[day] = { orderCount: 0, totalShippingFee: 0, deliveryCount: 0 }; // Nếu ngày chưa có, khởi tạo
      }
      groupedByDay[day].deliveryCount += 1; // Tăng delivery count cho ngày đó
    });

    // Chuyển đổi kết quả nhóm thành mảng
    const resultByDay = Object.keys(groupedByDay)
      .sort((a, b) => {
        const [da, ma, ya] = a.split('/').map(Number);
        const [db, mb, yb] = b.split('/').map(Number);
        const dateA = new Date(2000 + ya, ma - 1, da); // Chuyển về Date (lưu ý năm)
        const dateB = new Date(2000 + yb, mb - 1, db);
        return dateA.getTime() - dateB.getTime(); // tăng dần: xa → gần
      })
      .map((period) => ({
        period,
        ...groupedByDay[period],
      }));

    return {
      totalOrders,
      totalShippingFee,
      brandPercentages: [],
      resultByDay,
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
            studentId: user.id,
            latestStatus: {
              in: ['ACCEPTED', 'DELIVERED'],
            },
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
          studentId: user.id,
          latestStatus: {
            in: ['ACCEPTED', 'DELIVERED'],
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
      totalOrdersLastWeek,
      totalOrdersLastMonth,
      brandPercentages,
    };
  }

  override async getCurrentOrder(user: GetUserType): Promise<Order | null> {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [
          {
            studentId: user.id,
            latestStatus: 'IN_TRANSPORT',
          },
          {
            shipperId: user.id,
            latestStatus: 'IN_TRANSPORT',
          },
        ],
      },
    });
    console.log('Current order: ', order);
    return order || null;
  }

  override async groupOrders(groupOrdersDto: GroupOrdersDto): Promise<GroupOrdersResponseDto> {
    return this.pythonApi.groupOrders(groupOrdersDto);
  }

  override async delayOrders(delayOrdersDto: DelayOrdersDto): Promise<MessageResponseDto> {
    const { orderIds, timeslot } = delayOrdersDto;

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

    if (orders.some((order) => Number(order.deliveryDate) > Number(timeslot))) {
      throw new BadRequestException('One or more orders has delayed time smaller than before');
    }

    await this.prisma.$transaction(async (tx) => {
      // Tạo các promises cho các cập nhật đồng thời
      const updatePromises = orders.map((order) =>
        tx.order.update({
          where: { id: order.id },
          data: {
            deliveryDate: timeslot, // Cập nhật lại deliveryDate
          },
        })
      );
      // Chờ tất cả các promise cập nhật hoàn thành trong giao dịch
      await Promise.all(updatePromises);
    });

    return { message: 'Orders successfully delayed' };
  }

  override async routeOrders(routeOrdersDto: RouteOrdersDto): Promise<RouteOrdersResponseDto> {
    return this.pythonApi.routeOrders(routeOrdersDto);
  }
}
