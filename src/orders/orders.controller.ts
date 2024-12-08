import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { $Enums } from '@prisma/client';
import { AllowAuthenticated, checkRowLevelPermission, GetUser } from 'src/auth';
import { PageResponseDto } from 'src/common/dtos/page-response.dto';
import { GetUserType } from 'src/types';

import { CreateOrderDto, OrderQueryDto } from './dtos';
import { GetOrderResponseDto } from './dtos/response.dto';
import { OrderEntity } from './entity';
import { OrderService } from './orders.service';

@ApiTags('Orders')
@Controller('api/orders')
@ApiBearerAuth('JWT-Auth')
@ApiExtraModels(PageResponseDto, GetOrderResponseDto)
export class OrdersController {
  constructor(private readonly orderService: OrderService) {}

  @AllowAuthenticated('ADMIN', 'STUDENT')
  @ApiCreatedResponse({ type: OrderEntity })
  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @GetUser() user: GetUserType) {
    checkRowLevelPermission(user, createOrderDto.studentId); // || createOrderDto.adminId
    return this.orderService.createOrder(createOrderDto, user);
  }

  @AllowAuthenticated()
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
  @Get()
  async findAll(
    @Query() query: OrderQueryDto,
    @GetUser() user: GetUserType
  ): Promise<PageResponseDto<GetOrderResponseDto>> {
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
    @Body() updateOrderDto: CreateOrderDto,
    @GetUser() user: GetUserType
  ) {
    return this.orderService.updateOrderInfo(id, updateOrderDto, user);
  }

  @AllowAuthenticated('ADMIN', 'STAFF')
  @ApiOkResponse({ type: OrderEntity })
  @Patch('status/:id')
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
