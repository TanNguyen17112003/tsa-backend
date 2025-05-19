import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsDeliveryTimeSlot } from 'src/common';

export class CreateSlotDto {
  @IsDeliveryTimeSlot()
  @IsNotEmpty()
  @ApiProperty({ example: '07:00', description: 'Start time (e.g., 07:00)' })
  readonly startTime: string;

  @IsDeliveryTimeSlot()
  @IsNotEmpty()
  @ApiProperty({ example: '08:45', description: 'End time (e.g., 08:45)' })
  readonly endTime: string;
}

export class UpdateSlotDto {
  @IsString()
  @ApiProperty({ description: 'ID of the delivery slot to update' })
  readonly id: string;

  @IsOptional()
  @IsDeliveryTimeSlot()
  @ApiProperty({ example: '07:30', description: 'Updated start time', required: false })
  readonly startTime?: string;

  @IsOptional()
  @IsDeliveryTimeSlot()
  @ApiProperty({ example: '09:00', description: 'Updated end time', required: false })
  readonly endTime?: string;
}

export class RemoveSlotDto {
  @IsString()
  @ApiProperty({ description: 'ID of the delivery slot to remove' })
  readonly id: string;
}
