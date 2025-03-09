import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @ApiProperty({ name: 'title', description: 'Ticket title' })
  readonly title: string;

  @IsString()
  @ApiProperty({ name: 'content', description: 'Ticket content' })
  readonly content: string;

  @IsString()
  @ApiProperty({ name: 'categoryId', description: 'Ticket category ID' })
  readonly categoryId: string;
}
