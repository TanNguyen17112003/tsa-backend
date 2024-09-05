import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateSampleDto {
  @IsString()
  @ApiProperty({
    example: 'Content of sample',
    description: 'Content of sample v2',
  })
  content: string;
}
