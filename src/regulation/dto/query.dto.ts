import { ApiProperty } from '@nestjs/swagger';
import { Dormitory } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class GetRegulationQueryDto {
  @ApiProperty({
    description: 'Tên ký túc xá',
    enum: Dormitory,
    example: Dormitory.A,
    required: true,
  })
  @IsEnum(Dormitory, { message: 'Dormitory must be one of the valid values' })
  dormitory: Dormitory;
}
