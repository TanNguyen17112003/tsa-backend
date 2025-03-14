import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { Auth, GetUser } from 'src/auth';
import { GetUserType } from 'src/types';

import {
  CreateTicketDto,
  ReplyResponseDto,
  ReplyTicketDto,
  TicketQueryDto,
  TicketResponseDto,
  UpdateTicketStatusDto,
} from './dto';
import { TicketsService } from './tickets.service';

@Controller('api/tickets')
@ApiTags('Tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @Auth('STUDENT')
  @UseInterceptors(FilesInterceptor('attachments', 10, { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  createTicket(
    @UploadedFiles() attachments: Array<Express.Multer.File>,
    @Body() dto: CreateTicketDto,
    @GetUser() user: GetUserType
  ): Promise<TicketResponseDto> {
    return this.ticketsService.createTicket(attachments, dto, user.id);
  }

  @Get()
  @Auth('STUDENT', 'ADMIN')
  findAllTickets(
    @Query() query: TicketQueryDto,
    @GetUser() user: GetUserType
  ): Promise<TicketResponseDto[]> {
    return this.ticketsService.findAllTickets(query, user);
  }

  @Post('categories')
  @Auth('ADMIN')
  createCategory(@Body() dto: { name: string }) {
    return this.ticketsService.createCategory(dto);
  }

  @Get('categories')
  @Auth('STUDENT', 'ADMIN')
  findAllCategories() {
    return this.ticketsService.findAllCategories();
  }

  @Get(':id')
  @Auth('STUDENT', 'ADMIN')
  findTicketById(
    @Param('id') id: string,
    @GetUser() user: GetUserType
  ): Promise<TicketResponseDto> {
    return this.ticketsService.findTicketById(id, user);
  }

  @Post(':id/replies')
  @Auth('ADMIN', 'STUDENT')
  @UseInterceptors(FilesInterceptor('attachments', 10, { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  replyToTicket(
    @Param('id') id: string,
    @UploadedFiles() attachments: Array<Express.Multer.File>,
    @Body() dto: ReplyTicketDto,
    @GetUser() user: GetUserType
  ): Promise<ReplyResponseDto> {
    return this.ticketsService.replyToTicket(id, attachments, dto, user);
  }

  @Patch(':id/status')
  @Auth('ADMIN')
  updateTicketStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto
  ): Promise<TicketResponseDto> {
    return this.ticketsService.updateTicketStatus(id, dto);
  }
}
