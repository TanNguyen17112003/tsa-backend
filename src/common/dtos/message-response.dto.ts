import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ example: 'Request received', description: 'Description message' })
  readonly message: string;
}
