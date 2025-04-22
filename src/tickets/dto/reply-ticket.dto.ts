import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { IsNotBlank } from 'src/common';

export class ReplyTicketDto {
  @IsString()
  @IsNotBlank()
  @ApiProperty({ name: 'content', description: 'Ticket content' })
  readonly content: string;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  readonly attachments: any[];
}
