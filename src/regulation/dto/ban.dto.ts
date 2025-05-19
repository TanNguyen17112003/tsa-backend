import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateBanThresholdDto {
  @IsInt()
  @Min(0)
  @ApiProperty({ example: 3, description: 'Number of violations before a student is banned' })
  readonly banThreshold: number;
}
