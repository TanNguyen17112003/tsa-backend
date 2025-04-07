import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class DelayOrdersDto {
  @ApiProperty({ example: '1741161600', description: 'Timeslot' })
  @IsString()
  timeslot: string;

  @ApiProperty({ example: ['123456789', '123456788'], description: 'Order IDs' })
  @IsArray()
  orderIds: string[];
}
