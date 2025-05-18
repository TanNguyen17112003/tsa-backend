import { Dormitory } from '@prisma/client';

import { UpdateBanThresholdDto } from './dto/ban.dto';
import { GetRegulationDto } from './dto/get-regulation.dto';
import { CreateSlotDto, RemoveSlotDto, UpdateSlotDto } from './dto/slot.dto';

export abstract class RegulationService {
  /**
   * Lấy thông tin quy định của tất cả ký túc xá
   */
  abstract getAllRegulations(): Promise<GetRegulationDto[]>;
  /**
   * Lấy thông tin quy định của tất cả ký túc xá
   */
  abstract getRegulation(dormitory: Dormitory): Promise<GetRegulationDto>;
  /**
   * Cập nhật ngưỡng vi phạm để cấm
   */
  abstract updateBanThreshold(dormitoryId: string, dto: UpdateBanThresholdDto): Promise<void>;
  /**
   * Thêm 1 khung giờ giao hàng mới
   */
  abstract addDeliverySlot(dormitoryId: string, dto: CreateSlotDto): Promise<void>;

  /**
   * Cập nhật thông tin 1 khung giờ giao hàng
   */
  abstract updateDeliverySlot(dormitoryId: string, dto: UpdateSlotDto): Promise<void>;

  /**
   * Xoá 1 khung giờ giao hàng
   */
  abstract removeDeliverySlot(dormitoryId: string, dto: RemoveSlotDto): Promise<void>;
}
