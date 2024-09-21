import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AllowAuthenticated, GetUser } from 'src/common/auth/auth.decorator';
import { checkRowLevelPermission } from 'src/common/auth/util';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { GetUserType } from 'src/common/types';

import { CreateOrder } from './dtos/create.dto';
import { OrderQueryDto } from './dtos/query.dto';
import { UpdateOrder } from './dtos/update.dto';
import { OrderEntity } from './entity/order.entity';

@ApiTags('orders')
@Controller('api/orders')
@ApiBearerAuth('JWT-Auth')
export class OrdersController {
  constructor(private readonly prisma: PrismaService) {}

  @AllowAuthenticated('ADMIN', 'STUDENT')
  @ApiCreatedResponse({ type: OrderEntity })
  @Post()
  create(@Body() createOrderDto: CreateOrder, @GetUser() user: GetUserType) {
    checkRowLevelPermission(user, createOrderDto.studentId || createOrderDto.adminId);
    return this.prisma.order.create({ data: createOrderDto });
  }

  @AllowAuthenticated('ADMIN', 'STUDENT')
  @ApiOkResponse({ type: [OrderEntity] })
  @Get()
  findAll(@Query() { skip, take, order, sortBy }: OrderQueryDto, @GetUser() user: GetUserType) {
    return this.prisma.order.findMany({
      ...(skip ? { skip: +skip } : null),
      ...(take ? { take: +take } : null),
      ...(sortBy ? { orderBy: { [sortBy]: order || 'asc' } } : null),
      where:
        user.role === 'STUDENT'
          ? { studentId: user.id }
          : {
              adminId: user.id,
            },
    });
  }

  @AllowAuthenticated('ADMIN', 'STUDENT')
  @ApiOkResponse({ type: OrderEntity })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prisma.order.findUnique({ where: { id } });
  }

  @AllowAuthenticated()
  @ApiOkResponse({ type: OrderEntity })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrder,
    @GetUser() user: GetUserType
  ) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    checkRowLevelPermission(user, order.adminId || order.studentId);
    return this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
    });
  }

  @AllowAuthenticated()
  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser() user: GetUserType) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    checkRowLevelPermission(user, order.adminId);
    return this.prisma.order.delete({ where: { id } });
  }
}
