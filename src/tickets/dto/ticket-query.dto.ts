import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';
import { IsIn, IsOptional } from 'class-validator';

export class TicketQueryDto {
  @IsOptional()
  @IsIn(Object.values(TicketStatus))
  @ApiPropertyOptional({
    name: 'status',
    description: 'Status to filter tickets',
    enum: Object.values(TicketStatus),
  })
  readonly status?: TicketStatus;
}
