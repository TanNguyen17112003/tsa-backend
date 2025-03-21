import { Injectable, NotFoundException } from '@nestjs/common';
import { omit } from 'lodash';
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
    if (!(await this.prisma.ticketCategory.findUnique({ where: { id: dto.categoryId } }))) {
      throw new NotFoundException('Category not found');
    }
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
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
      photoUrl: user.photoUrl,
      userName: user.lastName + ' ' + user.firstName,
      replies: [],
    };
  }

  async findAllTickets(query: TicketQueryDto, user: GetUserType): Promise<TicketResponseDto[]> {
    const filter = {};

    if (user.role === 'STUDENT') {
      filter['studentId'] = user.id;
    }
    if (query.status) {
      filter['status'] = query.status;
    }

    const tickets = await this.prisma.ticket.findMany({
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
            user: {
              select: {
                photoUrl: true,
                firstName: true,
                lastName: true,
              },
            },
            attachments: {
              select: {
                fileUrl: true,
                uploadedAt: true,
              },
            },
          },
        },
        student: {
          select: {
            user: {
              select: {
                photoUrl: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return tickets.map((ticket) => {
      const ticketWithUserDetails = {
        ...ticket,
        userName: `${ticket.student.user.firstName} ${ticket.student.user.lastName}`,
        photoUrl: ticket.student.user.photoUrl,
        replies: ticket.replies.map((reply) => ({
          ...reply,
          userName: `${reply.user.firstName} ${reply.user.lastName}`,
          photoUrl: reply.user.photoUrl,
        })),
      };
      return omit(ticketWithUserDetails, ['student', 'replies.user']);
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
            user: {
              select: {
                photoUrl: true,
                firstName: true,
                lastName: true,
              },
            },
            attachments: {
              select: {
                fileUrl: true,
                uploadedAt: true,
              },
            },
          },
        },
        student: {
          select: {
            user: {
              select: {
                photoUrl: true,
                firstName: true,
                lastName: true,
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

    const ticketWithUserDetails = {
      ...ticket,
      userName: `${ticket.student.user.firstName} ${ticket.student.user.lastName}`,
      photoUrl: ticket.student.user.photoUrl,
      replies: ticket.replies.map((reply) => ({
        ...reply,
        userName: `${reply.user.firstName} ${reply.user.lastName}`,
        photoUrl: reply.user.photoUrl,
      })),
    };

    return omit(ticketWithUserDetails, ['student', 'replies.user']);
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
    const foundUser = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

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

    return {
      ...reply,
      userName: foundUser.lastName + ' ' + foundUser.firstName,
      photoUrl: foundUser.photoUrl,
    };
  }

  async updateTicketStatus(id: string, dto: UpdateTicketStatusDto): Promise<TicketResponseDto> {
    const ticket = await this.prisma.ticket.update({
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
            user: {
              select: {
                photoUrl: true,
                firstName: true,
                lastName: true,
              },
            },
            attachments: {
              select: {
                fileUrl: true,
                uploadedAt: true,
              },
            },
          },
        },
        student: {
          select: {
            user: {
              select: {
                photoUrl: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    const ticketWithUserDetails = {
      ...ticket,
      userName: `${ticket.student.user.firstName} ${ticket.student.user.lastName}`,
      photoUrl: ticket.student.user.photoUrl,
      replies: ticket.replies.map((reply) => ({
        ...reply,
        userName: `${reply.user.firstName} ${reply.user.lastName}`,
        photoUrl: reply.user.photoUrl,
      })),
    };

    return omit(ticketWithUserDetails, ['student', 'replies.user']);
  }

  private saveTicketAttachments(attachments: Express.Multer.File[]) {
    return Promise.all(
      attachments.map((attachment) =>
        this.cloudinaryService.uploadImage(attachment.buffer, 'tsa_image/ticket_attachments')
      )
    );
  }
}
