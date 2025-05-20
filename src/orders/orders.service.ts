import { Order } from '@prisma/client';
import { MessageResponseDto } from 'src/common/dtos/message-response.dto';
import { PageResponseDto } from 'src/common/dtos/page-response.dto';
import { GroupOrdersResponseDto, RouteOrdersResponseDto } from 'src/python-api/python-api.dto';
import { GetUserType } from 'src/types';

import {
  CreateAdminOrderDto,
  CreateOrderResponseDto,
  CreateStudentOrderDto,
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

export abstract class OrderService {
  abstract getOrders(
    query: OrderQueryDto,
    user: GetUserType
  ): Promise<PageResponseDto<GetOrderResponseDto>>;
  abstract getOrder(id: string): Promise<GetOrderResponseDto>;

  abstract createOrder(
    createOrderDto: CreateStudentOrderDto | CreateAdminOrderDto,
    user: GetUserType
  ): Promise<CreateOrderResponseDto>;

  abstract updateOrderInfo(
    id: string,
    updateOrderDto: CreateStudentOrderDto | CreateAdminOrderDto,
    user: GetUserType
  ): Promise<CreateOrderResponseDto>;

  abstract updateStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
    user: GetUserType
  ): Promise<MessageResponseDto>;

  abstract deleteOrder(id: string, user: GetUserType): Promise<MessageResponseDto>;

  abstract getShippingFee(query: ShippingFeeDto): Promise<{ shippingFee: number }>;

  abstract getOrdersStats(
    type: 'week' | 'month' | 'year',
    user: GetUserType
  ): Promise<StaffOrdersStatsDto | StudentOrdersStatsDto>;

  abstract getCurrentOrder(user: GetUserType): Promise<Order | null>;

  abstract groupOrders(groupOrdersDto: GroupOrdersDto): Promise<GroupOrdersResponseDto>;

  abstract delayOrders(delayOrdersDto: DelayOrdersDto): Promise<MessageResponseDto>;
  abstract routeOrders(routeOrdersDto: RouteOrdersDto): Promise<RouteOrdersResponseDto>;
}
