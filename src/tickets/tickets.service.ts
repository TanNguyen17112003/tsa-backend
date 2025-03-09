import { Injectable, NotFoundException } from '@nestjs/common';
import { CloudinaryService } from 'src/cloudinary';
import { PrismaService } from 'src/prisma';
import { GetUserType } from 'src/types';

import { CreateTicketDto, TicketQueryDto, TicketResponseDto } from './dto';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  async createTicket(
    attachments: Array<Express.Multer.File>,
    dto: CreateTicketDto,
    userId: string
  ): Promise<TicketResponseDto> {
    const savedAttachments = await Promise.all(
      attachments.map((attachment) =>
        this.cloudinaryService.uploadImage(attachment.buffer, 'tsa_image/ticket_attachments')
      )
    );

    const ticket = await this.prisma.ticket.create({
      data: {
        title: dto.title,
        content: dto.content,
        attachments: {
          create: savedAttachments.map((result) => ({
            fileUrl: result.secure_url,
          })),
        },
        student: {
          connect: {
            studentId: userId,
          },
        },
        category: {
          connect: {
            id: dto.categoryId,
          },
        },
      },
      include: {
        attachments: {
          select: {
            fileUrl: true,
          },
        },
      },
    });

    return ticket;
  }

  findAllTickets(query: TicketQueryDto, user: GetUserType): Promise<TicketResponseDto[]> {
    const filter = {};

    if (user.role === 'STUDENT') {
      filter['studentId'] = user.id;
    }
    if (query.status) {
      filter['status'] = query.status;
    }

    return this.prisma.ticket.findMany({
      where: filter,
      include: {
        attachments: {
          select: {
            fileUrl: true,
          },
        },
      },
    });
  }

  createCategory(dto: { name: string }): Promise<{ id: string; name: string }> {
    return this.prisma.ticketCategory.create({
      data: {
        name: dto.name,
      },
    });
  }

  findAllCategories(): Promise<{ id: string; name: string }[]> {
    return this.prisma.ticketCategory.findMany();
  }

  async findTicketById(id: string, user: GetUserType): Promise<TicketResponseDto> {
    const ticket = await this.prisma.ticket.findUnique({
      where: {
        id,
      },
      include: {
        attachments: {
          select: {
            fileUrl: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (user.role === 'STUDENT' && ticket.studentId !== user.id) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }
}
