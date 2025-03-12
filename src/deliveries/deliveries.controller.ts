import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Auth, GetUser } from 'src/auth';
import { GetUserType } from 'src/types';

import { DeliveriesService } from './deliveries.service';
import {
  CreateDeliveryDto,
  GetDeliveriesDto,
  GetDeliveryDto,
  UpdateDeliveryDto,
  UpdateStatusDto,
} from './dtos';
import { DeliveryEntity } from './entities';

@Controller('api/deliveries')
@ApiTags('Deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Post()
  @Auth('ADMIN')
  @ApiCreatedResponse({ type: DeliveryEntity })
  createDelivery(@Body() createDeliveryDto: CreateDeliveryDto): Promise<DeliveryEntity> {
    return this.deliveriesService.createDelivery(createDeliveryDto);
  }

  @Get()
  @Auth('ADMIN', 'STAFF')
  @ApiOkResponse({ type: [GetDeliveryDto] })
  findAllDeliveries(@GetUser() user: GetUserType): Promise<GetDeliveriesDto[]> {
    return this.deliveriesService.getDeliveries(user);
  }

  @Get(':id')
  @Auth()
  @ApiOkResponse({ type: GetDeliveryDto })
  findOneDelivery(@Param('id') id: string): Promise<GetDeliveryDto> {
    return this.deliveriesService.getDelivery(id);
  }

  @Patch(':id')
  @Auth('ADMIN')
  @ApiOkResponse({ type: DeliveryEntity })
  async updateInfo(
    @Param('id') id: string,
    @Body() updateDeliveryDto: UpdateDeliveryDto
  ): Promise<DeliveryEntity> {
    return this.deliveriesService.updateDelivery(id, updateDeliveryDto);
  }

  @Patch('status/:id')
  @Auth('ADMIN', 'STAFF')
  @ApiOkResponse({ type: DeliveryEntity })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @GetUser() user: GetUserType
  ): Promise<DeliveryEntity> {
    return this.deliveriesService.updateDeliveryStatus(id, updateStatusDto, user);
  }

  @Delete(':id')
  @Auth('ADMIN')
  @ApiOkResponse({ type: DeliveryEntity })
  async remove(@Param('id') id: string): Promise<DeliveryEntity> {
    return this.deliveriesService.deleteDelivery(id);
  }
}
