import { ApiProperty } from '@nestjs/swagger';

export class PageResponseDto<TData> {
  @ApiProperty({ description: 'Total elements of the list' })
  totalElements: number;

  @ApiProperty({ description: 'Total pages ' })
  totalPages: number;

  results: TData[];
}
