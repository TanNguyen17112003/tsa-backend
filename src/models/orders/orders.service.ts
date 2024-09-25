import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetUserType } from 'src/types';

import { CreateAdminOrderDto, CreateStudentOrderDto } from './dtos/create.dto';

export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(
    createOrderDto: CreateStudentOrderDto | CreateAdminOrderDto,
    user: GetUserType
  ) {
    const { checkCode, product, weight } = createOrderDto;

    if ('studentId' in createOrderDto) {
      if (user.role !== 'STUDENT' || user.id !== createOrderDto.studentId) {
        throw new UnauthorizedException();
      }

      const existingOrder = await this.prisma.order.findFirst({
        where: { checkCode, product, weight },
      });

      if (existingOrder) {
        await this.prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            ...createOrderDto,
          },
        });
        return { message: 'Order updated and status set to REJECTED' };
      }

      return this.prisma.order.create({ data: createOrderDto as CreateStudentOrderDto });
    } else if ('adminId' in createOrderDto) {
      if (user.role !== 'ADMIN' || user.id !== createOrderDto.adminId) {
        throw new UnauthorizedException();
      }

      const existingOrder = await this.prisma.order.findFirst({
        where: { checkCode, product, weight },
      });

      if (existingOrder) {
        await this.prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            phone: (createOrderDto as CreateAdminOrderDto).phone,
          },
        });
        return { message: 'Order updated and status set to ACCEPTED' };
      }

      return this.prisma.order.create({ data: createOrderDto as CreateAdminOrderDto });
    } else {
      throw new BadRequestException('Invalid order creation request');
    }
  }
}
