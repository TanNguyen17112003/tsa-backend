import { TicketCategory } from '@prisma/client';
import { GetUserType } from 'src/types';

import {
  CreateTicketDto,
  ReplyResponseDto,
  ReplyTicketDto,
  TicketQueryDto,
  TicketResponseDto,
  UpdateTicketStatusDto,
} from './dto';

export abstract class TicketsService {
  abstract createTicket(
    attachments: Array<Express.Multer.File>,
    dto: CreateTicketDto,
    userId: string
  ): Promise<TicketResponseDto>;

  abstract findAllTickets(query: TicketQueryDto, user: GetUserType): Promise<TicketResponseDto[]>;

  abstract createCategory(dto: { name: string }): Promise<TicketCategory>;

  abstract findAllCategories(): Promise<TicketCategory[]>;

  abstract findTicketById(id: string, user: GetUserType): Promise<TicketResponseDto>;

  abstract replyToTicket(
    id: string,
    attachments: Express.Multer.File[],
    dto: ReplyTicketDto,
    user: GetUserType
  ): Promise<ReplyResponseDto>;

  abstract updateTicketStatus(id: string, dto: UpdateTicketStatusDto): Promise<TicketResponseDto>;
}
