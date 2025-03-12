import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Auth, checkRowLevelPermission, GetUser } from 'src/auth';
import { PageResponseDto } from 'src/common/dtos/page-response.dto';
import { GetUserType } from 'src/types';

import { CreateOrderDto, GetOrderResponseDto, OrderQueryDto, UpdateStatusDto } from './dtos';
import { ShippingFeeDto } from './dtos/shippingFee.dto';
import { OrderEntity } from './entity';
import { OrderService } from './orders.service';

@Controller('api/orders')
@ApiTags('Orders')
@ApiExtraModels(PageResponseDto, GetOrderResponseDto)
export class OrdersController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @Auth('ADMIN', 'STUDENT')
  @ApiCreatedResponse({ type: OrderEntity })
  create(@Body() createOrderDto: CreateOrderDto, @GetUser() user: GetUserType) {
    checkRowLevelPermission(user, createOrderDto.studentId); // || createOrderDto.adminId
    return this.orderService.createOrder(createOrderDto, user);
  }

  @Get('shipping-fee')
  @Auth()
  @ApiOkResponse({ type: OrderEntity })
  async getShippingFee(@Query() query: ShippingFeeDto) {
    return this.orderService.getShippingFee(query);
  }

  @Get()
  @Auth()
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(PageResponseDto) },
        {
          properties: {
            results: {
              type: 'array',
              items: { $ref: getSchemaPath(GetOrderResponseDto) },
            },
          },
        },
      ],
    },
  })
  async findAll(@Query() query: OrderQueryDto, @GetUser() user: GetUserType) {
    return this.orderService.getOrders(query, user);
  }

  @Get('stats')
  @Auth()
  getOrdersStats(@Query('type') type: 'week' | 'month' | 'year', @GetUser() user: GetUserType) {
    return this.orderService.getOrdersStats(type, user);
  }

  @Get('current')
  @Auth('STAFF', 'STUDENT')
  @ApiOkResponse({ type: OrderEntity })
  async getCurrentOrder(@GetUser() user: GetUserType) {
    return this.orderService.getCurrentOrder(user);
  }

  @Get(':id')
  @Auth()
  @ApiOkResponse({ type: OrderEntity })
  findOne(@Param('id') id: string) {
    return this.orderService.getOrder(id);
  }

  @Patch(':id')
  @Auth('ADMIN', 'STUDENT')
  @ApiOkResponse({ type: OrderEntity })
  async updateInfo(
    @Param('id') id: string,
    @Body() updateOrderDto: CreateOrderDto,
    @GetUser() user: GetUserType
  ) {
    return this.orderService.updateOrderInfo(id, updateOrderDto, user);
  }

  @Patch('status/:id')
  @Auth('ADMIN', 'STAFF')
  @ApiOkResponse({ type: OrderEntity })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @GetUser() user: GetUserType
  ) {
    return this.orderService.updateStatus(id, updateStatusDto, user);
  }

  @Delete(':id')
  @Auth('ADMIN', 'STUDENT')
  async remove(@Param('id') id: string, @GetUser() user: GetUserType) {
    return this.orderService.deleteOrder(id, user);
  }
}
