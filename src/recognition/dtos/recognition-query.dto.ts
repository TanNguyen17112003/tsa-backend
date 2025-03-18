import { ApiProperty } from '@nestjs/swagger';

export class RecognitionQueryDto {
  @ApiProperty({ description: 'Page number', example: 1 })
  readonly page: number;

  @ApiProperty({ description: 'Page size', example: 10 })
  readonly size: number;
}
