import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';

export class TicketResponseDto {
  @ApiProperty({ name: 'id', description: 'Ticket ID', example: 'abcd1234' })
  readonly id: string;

  @ApiProperty({ name: 'studentId', description: 'Student ID', example: 'efgh5678' })
  readonly studentId: string;

  @ApiProperty({ name: 'Ticket title', description: 'Ticket title' })
  readonly title: string;

  @ApiProperty({ name: 'Ticket content', description: 'Ticket content' })
  readonly content: string;

  @ApiProperty({ name: 'OPEN', description: 'Ticket status', example: TicketStatus.PENDING })
  readonly status: TicketStatus;

  @ApiProperty({ name: 'categoryId', description: 'Ticket category ID', example: 'ijkl9012' })
  readonly categoryId: string;

  @ApiProperty({
    name: 'createdAt',
    description: 'Ticket created date',
    example: '2021-08-01T00:00:00.000Z',
  })
  readonly createdAt: Date;

  @ApiProperty({ name: 'attachments', description: 'Ticket attachments' })
  readonly attachments: {
    fileUrl: string;
  }[];
}
