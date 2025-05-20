import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsString, Min, ValidateNested } from 'class-validator';

export class DeliverySlotDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Start time of the delivery slot (e.g., "07:00")' })
  readonly startTime: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'End time of the delivery slot (e.g., "08:45")' })
  readonly endTime: string;
}

export class CreateRegulationDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ name: 'name', description: 'Name of the dormitory regulation' })
  readonly name: string;

  @IsInt()
  @Min(0)
  @ApiProperty({ description: 'Threshold number of violations to be banned' })
  readonly banThreshold: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliverySlotDto)
  @ApiProperty({
    description: 'List of allowed delivery time slots',
    type: [DeliverySlotDto],
  })
  readonly deliverySlots: DeliverySlotDto[];
}
