import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { $Enums } from '@prisma/client';
import { AllowAuthenticated, GetUser } from 'src/auth/auth.decorator';
import { checkRowLevelPermission } from 'src/auth/util';
import { PrismaService } from 'src/prisma';
import { GetUserType } from 'src/types';

import { CreateAdminOrderDto, CreateOrderDto, CreateStudentOrderDto } from './dtos/create.dto';
import { OrderQueryDto } from './dtos/query.dto';
import { OrderEntity } from './entity/order.entity';
import { OrderService } from './orders.service';

@ApiTags('orders')
@Controller('api/orders')
@ApiBearerAuth('JWT-Auth')
export class OrdersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderService: OrderService
  ) {}

  @AllowAuthenticated('ADMIN', 'STUDENT')
  @ApiCreatedResponse({ type: OrderEntity })
  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @GetUser() user: GetUserType) {
    checkRowLevelPermission(user, createOrderDto.studentId || createOrderDto.adminId);
    return this.orderService.createOrder(createOrderDto, user);
  }

  @AllowAuthenticated('ADMIN', 'STUDENT')
  @ApiOkResponse({ type: [OrderEntity] })
  @Get()
  findAll(@Query() query: OrderQueryDto, @GetUser() user: GetUserType) {
    return this.orderService.getOrders(query, user);
  }

  @AllowAuthenticated()
  @ApiOkResponse({ type: OrderEntity })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.getOrder(id);
  }

  @AllowAuthenticated('ADMIN', 'STUDENT')
  @ApiOkResponse({ type: OrderEntity })
  @Patch(':id')
  async updateInfo(
    @Param('id') id: string,
    @Body() updateOrderDto: CreateStudentOrderDto | CreateAdminOrderDto,
    @GetUser() user: GetUserType
  ) {
    return this.orderService.updateOrderInfo(id, updateOrderDto, user);
  }

  @AllowAuthenticated('ADMIN', 'STAFF')
  @ApiOkResponse({ type: OrderEntity })
  @Patch(':id')
  async updateStatus(
    @Param('id') id: string,
    @Body() status: $Enums.OrderStatus,
    @GetUser() user: GetUserType
  ) {
    return this.orderService.updateStatus(id, status, user);
  }

  @AllowAuthenticated('ADMIN', 'STUDENT')
  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser() user: GetUserType) {
    return this.orderService.deleteOrder(id, user);
  }
}
