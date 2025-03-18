import { ApiProperty } from '@nestjs/swagger';

export class RecognitionEntity {
  @ApiProperty({ description: 'Recognition ID', example: 'abcd1234' })
  readonly id: string;

  @ApiProperty({ description: 'Recognized text', example: 'Recognized text from image' })
  readonly text: string;

  @ApiProperty({ description: 'Created date', example: '2021-08-01T00:00:00.000Z' })
  readonly createdAt: Date;
}
