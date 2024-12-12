import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { DeliveryStatus } from '@prisma/client';
import { AllowAuthenticated, GetUser } from 'src/auth';
import { GetUserType } from 'src/types';

import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto, UpdateDeliveryDto } from './dtos';
import { DeliveryEntity } from './entities';

@ApiTags('Deliveries')
@ApiBearerAuth('JWT-Auth')
@Controller('api/deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @AllowAuthenticated('ADMIN')
  @ApiCreatedResponse({ type: DeliveryEntity })
  @Post()
  createDelivery(@Body() createDeliveryDto: CreateDeliveryDto): Promise<DeliveryEntity> {
    return this.deliveriesService.createDelivery(createDeliveryDto);
  }

  @AllowAuthenticated('ADMIN', 'STAFF')
  @ApiOkResponse({ type: [DeliveryEntity] })
  @Get()
  findAllDeliveries(@GetUser() user: GetUserType): Promise<DeliveryEntity[]> {
    return this.deliveriesService.getDeliveries(user);
  }

  @AllowAuthenticated()
  @ApiOkResponse({ type: DeliveryEntity })
  @Get(':id')
  findOneDelivery(@Param('id') id: string): Promise<DeliveryEntity> {
    return this.deliveriesService.getDelivery(id);
  }

  @AllowAuthenticated('ADMIN')
  @ApiOkResponse({ type: DeliveryEntity })
  @Patch(':id')
  async updateInfo(
    @Param('id') id: string,
    @Body() updateDeliveryDto: UpdateDeliveryDto
  ): Promise<DeliveryEntity> {
    return this.deliveriesService.updateDelivery(id, updateDeliveryDto);
  }

  @AllowAuthenticated('ADMIN', 'STAFF')
  @ApiOkResponse({ type: DeliveryEntity })
  @Patch('status/:id')
  async updateStatus(
    @Param('id') id: string,
    @Body() status: DeliveryStatus
  ): Promise<DeliveryEntity> {
    return this.deliveriesService.updateDeliveryStatus(id, status);
  }

  @AllowAuthenticated('ADMIN')
  @ApiOkResponse({ type: DeliveryEntity })
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<DeliveryEntity> {
    return this.deliveriesService.deleteDelivery(id);
  }
}
