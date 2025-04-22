import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';

export class TicketResponseDto {
  @ApiProperty({ name: 'id', description: 'Ticket ID', example: 'abcd1234' })
  readonly id: string;

  @ApiProperty({ name: 'studentId', description: 'Student ID', example: 'efgh5678' })
  readonly studentId: string;

  @ApiProperty({
    name: 'photoUrl',
    description: 'Student photo URL',
    example: 'https://example.com/photo.jpg',
  })
  readonly photoUrl: string;

  @ApiProperty({ name: 'studentName', description: 'Student name', example: 'John Doe' })
  readonly userName: string;

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

  @ApiProperty({ name: 'displayId', description: 'Ticket display ID', example: 'TKT-1234' })
  readonly displayId: string;

  @ApiProperty({ name: 'attachments', description: 'Ticket attachments' })
  readonly attachments: AttachmentResponseDto[];

  @ApiProperty({ name: 'replies', description: 'Ticket replies' })
  readonly replies: ReplyResponseDto[];
}

export class ReplyResponseDto {
  @ApiProperty({ name: 'id', description: 'Reply ID', example: 'mnop3456' })
  readonly id: string;

  @ApiProperty({ name: 'content', description: 'Reply content' })
  readonly content: string;

  @ApiProperty({
    name: 'createdAt',
    description: 'Reply created date',
    example: '2021-08-01T00:00:00.000Z',
  })
  readonly createdAt: Date;

  @ApiProperty({ name: 'userId', description: 'User ID', example: 'qrst5678' })
  readonly userId: string;

  @ApiProperty({
    name: 'photoUrl',
    description: 'User photo URL',
    example: 'https://example.com/photo.jpg',
  })
  readonly photoUrl: string;

  @ApiProperty({ name: 'userName', description: 'User name', example: 'Jane Doe' })
  readonly userName: string;

  @ApiProperty({ name: 'attachments', description: 'Reply attachments' })
  readonly attachments: AttachmentResponseDto[];
}

export class AttachmentResponseDto {
  @ApiProperty({ name: 'fileUrl', description: 'Attachment file URL' })
  readonly fileUrl: string;

  @ApiProperty({
    name: 'uploadedAt',
    description: 'Attachment uploaded date',
    example: '2021-08-01T00:00:00.000Z',
  })
  readonly uploadedAt: Date;
}
