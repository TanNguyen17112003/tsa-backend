import { ApiProperty } from '@nestjs/swagger';

export class Sample {
  @ApiProperty({
    example: 'Content of sample',
    description: 'Content of sample v2',
    required: true,
  })
  content: string;

  // This will store the ID of the User
}
