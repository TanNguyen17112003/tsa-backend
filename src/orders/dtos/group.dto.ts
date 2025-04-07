import { ApiProperty } from '@nestjs/swagger';
import { Dormitory } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

type groupMode = 'balanced' | 'free';
export class GroupOrdersDto {
  @ApiProperty({ example: 20.0, description: 'Max weight' })
  @IsOptional()
  @IsNumber()
  maxWeight: number;

  @ApiProperty({ example: 'A', description: 'Dormitory' })
  @IsEnum(Dormitory)
  dormitory: Dormitory;

  @ApiProperty({ example: '1741161600', description: 'Timeslot' })
  @IsString()
  timeslot: string;

  @ApiProperty({ example: 'balanced', description: 'Mode' })
  @IsOptional()
  @IsEnum(['free', 'balanced'])
  mode: groupMode;
}
