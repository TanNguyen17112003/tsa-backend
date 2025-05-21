import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/auth';

import { UpdateBanThresholdDto } from './dto/ban.dto';
import { GetRegulationDto } from './dto/get-regulation.dto';
import { GetRegulationQueryDto } from './dto/query.dto';
import { CreateSlotDto, RemoveSlotDto, UpdateSlotDto } from './dto/slot.dto';
import { RegulationService } from './regulation.service';

@Controller('api/regulation')
@ApiTags('Regulation')
export class RegulationController {
  constructor(private readonly regulationService: RegulationService) {}

  @Get('/all')
  @Auth('ADMIN', 'STUDENT')
  @ApiOkResponse({ description: 'Lấy quy định ký túc xá thành công', type: GetRegulationDto })
  async getAll(): Promise<GetRegulationDto[]> {
    return this.regulationService.getAllRegulations();
  }

  @Get()
  @Auth('ADMIN', 'STUDENT')
  @ApiOkResponse({ description: 'Lấy quy định ký túc xá thành công', type: GetRegulationDto })
  async getOne(
    @Query(new ValidationPipe({ transform: true })) query: GetRegulationQueryDto
  ): Promise<GetRegulationDto> {
    return this.regulationService.getRegulation(query.dormitory);
  }

  @Patch(':dormitoryId/ban-threshold')
  @Auth('ADMIN')
  @ApiOkResponse({ description: 'Cập nhật quy định ký túc xá thành công' })
  async updateBanThreshold(
    @Param('dormitoryId') dormitoryId: string,
    @Body() dto: UpdateBanThresholdDto
  ): Promise<void> {
    return this.regulationService.updateBanThreshold(dormitoryId, dto);
  }

  @Post(':dormitoryId/delivery-slots')
  @Auth('ADMIN')
  @ApiOkResponse({ description: 'Cập nhật quy định ký túc xá thành công' })
  async addDeliverySlot(
    @Param('dormitoryId') dormitoryId: string,
    @Body() dto: CreateSlotDto
  ): Promise<void> {
    return this.regulationService.addDeliverySlot(dormitoryId, dto);
  }

  @Patch(':dormitoryId/delivery-slots')
  @Auth('ADMIN')
  @ApiOkResponse({ description: 'Cập nhật quy định ký túc xá thành công' })
  async updateDeliverySlot(
    @Param('dormitoryId') dormitoryId: string,
    @Body() dto: UpdateSlotDto
  ): Promise<void> {
    return this.regulationService.updateDeliverySlot(dormitoryId, dto);
  }

  @Delete(':dormitoryId/delivery-slots')
  @Auth('ADMIN')
  @ApiOkResponse({ description: 'Cập nhật quy định ký túc xá thành công' })
  async removeDeliverySlot(
    @Param('dormitoryId') dormitoryId: string,
    @Body() dto: RemoveSlotDto
  ): Promise<void> {
    return this.regulationService.removeDeliverySlot(dormitoryId, dto);
  }
}
