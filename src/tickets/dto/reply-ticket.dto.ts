import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ReplyTicketDto {
  @IsString()
  @ApiProperty({ name: 'content', description: 'Ticket content' })
  readonly content: string;
}
