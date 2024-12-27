import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AllowAuthenticated, GetUser } from 'src/auth';
import { GetUserType } from 'src/types';

import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto, GetDeliveryDto, UpdateDeliveryDto, UpdateStatusDto } from './dtos';
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
  @ApiOkResponse({ type: [GetDeliveryDto] })
  @Get()
  findAllDeliveries(@GetUser() user: GetUserType): Promise<GetDeliveryDto[]> {
    return this.deliveriesService.getDeliveries(user);
  }

  @AllowAuthenticated()
  @ApiOkResponse({ type: GetDeliveryDto })
  @Get(':id')
  findOneDelivery(@Param('id') id: string): Promise<GetDeliveryDto> {
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
    @Body() updateStatusDto: UpdateStatusDto
  ): Promise<DeliveryEntity> {
    return this.deliveriesService.updateDeliveryStatus(id, updateStatusDto);
  }

  @AllowAuthenticated('ADMIN')
  @ApiOkResponse({ type: DeliveryEntity })
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<DeliveryEntity> {
    return this.deliveriesService.deleteDelivery(id);
  }
}
