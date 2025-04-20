import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { IsNotBlank } from 'src/common';

export class CreateTicketDto {
  @IsString()
  @IsNotBlank()
  @ApiProperty({ name: 'title', description: 'Ticket title' })
  readonly title: string;

  @IsString()
  @IsNotBlank()
  @ApiProperty({ name: 'content', description: 'Ticket content' })
  readonly content: string;

  @IsString()
  @ApiProperty({ name: 'categoryId', description: 'Ticket category ID' })
  readonly categoryId: string;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  readonly attachments: any[];
}
