import { Injectable, NotFoundException } from '@nestjs/common';
import { CloudinaryService } from 'src/cloudinary';
import { PrismaService } from 'src/prisma';
import { GetUserType } from 'src/types';

import {
  CreateTicketDto,
  ReplyResponseDto,
  ReplyTicketDto,
  TicketQueryDto,
  TicketResponseDto,
  UpdateTicketStatusDto,
} from './dto';

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
    const savedAttachments = await this.saveTicketAttachments(attachments);

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
            uploadedAt: true,
          },
        },
      },
    });

    return {
      ...ticket,
      replies: [],
    };
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
            uploadedAt: true,
          },
        },
        replies: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            userId: true,
            attachments: {
              select: {
                fileUrl: true,
                uploadedAt: true,
              },
            },
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
            uploadedAt: true,
          },
        },
        replies: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            userId: true,
            attachments: {
              select: {
                fileUrl: true,
                uploadedAt: true,
              },
            },
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

  async replyToTicket(
    id: string,
    attachments: Express.Multer.File[],
    dto: ReplyTicketDto,
    user: GetUserType
  ): Promise<ReplyResponseDto> {
    if (!(await this.prisma.ticket.findUnique({ where: { id } }))) {
      throw new NotFoundException('Ticket not found');
    }

    const savedAttachments = await this.saveTicketAttachments(attachments);

    const reply = await this.prisma.ticketReply.create({
      data: {
        content: dto.content,
        attachments: {
          create: savedAttachments.map((result) => ({
            fileUrl: result.secure_url,
          })),
        },
        ticket: {
          connect: {
            id,
          },
        },
        user: {
          connect: {
            id: user.id,
          },
        },
      },
      include: {
        attachments: {
          select: {
            fileUrl: true,
            uploadedAt: true,
          },
        },
      },
    });

    return reply;
  }

  updateTicketStatus(id: string, dto: UpdateTicketStatusDto): Promise<TicketResponseDto> {
    return this.prisma.ticket.update({
      where: { id },
      data: {
        status: dto.status,
      },
      include: {
        attachments: {
          select: {
            fileUrl: true,
            uploadedAt: true,
          },
        },
        replies: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            userId: true,
            attachments: {
              select: {
                fileUrl: true,
                uploadedAt: true,
              },
            },
          },
        },
      },
    });
  }

  private saveTicketAttachments(attachments: Express.Multer.File[]) {
    return Promise.all(
      attachments.map((attachment) =>
        this.cloudinaryService.uploadImage(attachment.buffer, 'tsa_image/ticket_attachments')
      )
    );
  }
}
