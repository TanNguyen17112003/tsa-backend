import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';
import { IsIn } from 'class-validator';

export class UpdateTicketStatusDto {
  @IsIn(Object.values(TicketStatus))
  @ApiProperty({ name: 'status', description: 'Ticket status', example: TicketStatus.PENDING })
  readonly status: TicketStatus;
}
