import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from 'src/cloudinary';
import { IdGeneratorService } from 'src/id-generator';
import { PrismaService } from 'src/prisma';
import { GetUserType } from 'src/types';

import { CreateTicketDto, UpdateTicketStatusDto } from './dto';
import { TicketsService } from './tickets.service';

describe('TicketsService', () => {
  let service: TicketsService;

  const mockPrismaService = {
    ticketCategory: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    ticket: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    ticketReply: {
      create: jest.fn(),
    },
  };

  const mockCloudinaryService = {
    uploadImage: jest.fn().mockResolvedValue({
      secure_url: 'uploaded.jpg',
    }),
  };

  const mockIdGeneratorService = {
    generateUniqueId: jest.fn().mockResolvedValue('TKT-123'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
        {
          provide: IdGeneratorService,
          useValue: mockIdGeneratorService,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTicket', () => {
    it('should create a ticket and return data', async () => {
      const attachments: Array<Express.Multer.File> = [
        { buffer: Buffer.from('file1') } as Express.Multer.File,
        { buffer: Buffer.from('file2') } as Express.Multer.File,
      ];
      const dto: CreateTicketDto = {
        title: 'Title',
        content: 'Content',
        categoryId: 'cat-id',
        attachments,
      };

      mockPrismaService.ticketCategory.findUnique.mockResolvedValue({ id: 'cat-id' });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-id',
        firstName: 'John',
        lastName: 'Doe',
        photoUrl: 'url',
      });
      mockPrismaService.ticket.create.mockResolvedValue({
        id: 'ticket-id',
        title: 'Title',
        content: 'Content',
        displayId: 'TKT-123',
        attachments: [
          {
            fileUrl: 'uploaded.jpg',
            uploadedAt: new Date(),
          },
          {
            fileUrl: 'uploaded.jpg',
            uploadedAt: new Date(),
          },
        ],
      });

      const result = await service.createTicket(attachments, dto, 'user-id');

      expect(result.id).toBe('ticket-id');
      expect(result.title).toBe('Title');
      expect(result.content).toBe('Content');
      expect(result.displayId).toBe('TKT-123');
      expect(result.photoUrl).toBe('url');
      expect(result.userName).toBe('Doe John');
      expect(result.attachments).toHaveLength(2);
      expect(result.attachments[0]).toEqual({
        fileUrl: 'uploaded.jpg',
        uploadedAt: expect.any(Date),
      });
    });

    it('should throw if category not found', async () => {
      mockPrismaService.ticketCategory.findUnique.mockResolvedValue(null);

      await expect(
        service.createTicket(
          [],
          {
            title: 'Title',
            content: 'Content',
            categoryId: 'cat-id',
            attachments: [],
          },
          'user-id'
        )
      ).rejects.toThrow('Category not found');
    });

    it('should throw if user not found', async () => {
      mockPrismaService.ticketCategory.findUnique.mockResolvedValue({ id: 'cat-id' });
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createTicket(
          [],
          {
            title: 'Title',
            content: 'Content',
            categoryId: 'cat-id',
            attachments: [],
          },
          'user-id'
        )
      ).rejects.toThrow('User not found');
    });
  });

  describe('findAllTickets', () => {
    const mockTickets = [
      {
        id: 't1',
        title: 'Title 1',
        status: 'OPEN',
        attachments: [],
        replies: [],
        studentId: 'student1',
        student: {
          user: {
            photoUrl: 'img1.jpg',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      },
      {
        id: 't2',
        title: 'Title 2',
        status: 'CLOSED',
        attachments: [],
        replies: [],
        studentId: 'student2',
        student: {
          user: {
            photoUrl: 'img2.jpg',
            firstName: 'Jane',
            lastName: 'Smith',
          },
        },
      },
    ];

    it('should return mapped tickets for a student', async () => {
      const user: GetUserType = {
        id: 'student1',
        email: 'test@example.com',
        role: 'STUDENT',
      };

      mockPrismaService.ticket.findMany.mockResolvedValue(mockTickets.slice(0, 1));

      const result = await service.findAllTickets({}, user);

      expect(result).toHaveLength(1);
      expect(result[0].userName).toBe('John Doe');
      expect(result[0].photoUrl).toBe('img1.jpg');
      expect(result[0].studentId).toBe('student1');
    });

    it('should return mapped tickets for an admin', async () => {
      const user: GetUserType = {
        id: 'admin1',
        email: 'test@example.com',
        role: 'ADMIN',
      };

      mockPrismaService.ticket.findMany.mockResolvedValue(mockTickets);

      const result = await service.findAllTickets({}, user);

      expect(result).toHaveLength(2);
      expect(result[0].userName).toBe('John Doe');
      expect(result[0].photoUrl).toBe('img1.jpg');
      expect(result[0].studentId).toBe('student1');
      expect(result[1].userName).toBe('Jane Smith');
      expect(result[1].photoUrl).toBe('img2.jpg');
      expect(result[1].studentId).toBe('student2');
    });

    it('should return mapped tickets for an admin with status filter', async () => {
      const user: GetUserType = {
        id: 'admin1',
        email: 'test@example.com',
        role: 'ADMIN',
      };

      mockPrismaService.ticket.findMany.mockResolvedValue(mockTickets.slice(0, 1));

      const result = await service.findAllTickets({ status: 'PENDING' }, user);

      expect(result).toHaveLength(1);
      expect(result[0].userName).toBe('John Doe');
      expect(result[0].photoUrl).toBe('img1.jpg');
      expect(result[0].studentId).toBe('student1');
    });
  });

  describe('createCategory', () => {
    it('should create and return category', async () => {
      mockPrismaService.ticketCategory.create.mockResolvedValue({ id: '123', name: 'Support' });

      const result = await service.createCategory({ name: 'Support' });

      expect(result).toEqual({
        id: '123',
        name: 'Support',
      });
    });
  });

  describe('findAllCategories', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        {
          id: '1',
          name: 'Support',
        },
        {
          id: '2',
          name: 'General Inquiry',
        },
      ];
      mockPrismaService.ticketCategory.findMany.mockResolvedValue(mockCategories);

      const result = await service.findAllCategories();

      expect(result).toEqual(mockCategories);
    });
  });

  describe('findTicketById', () => {
    const user: GetUserType = {
      id: 'user-id',
      email: 'test@example.com',
      role: 'STUDENT',
    };

    it('should return mapped ticket', async () => {
      const mockTicket = {
        id: 'ticket-1',
        studentId: 'user-id',
        title: 'Ticket Title',
        content: 'Ticket Content',
        status: 'PENDING',
        categoryId: 'cat-id',
        displayId: 'TKT-123',
        createdAt: new Date(),
        attachments: [],
        replies: [],
        student: {
          user: {
            firstName: 'John',
            lastName: 'Doe',
            photoUrl: 'url',
          },
        },
      };

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);

      const result = await service.findTicketById('ticket-1', user);
      expect(result).toEqual({
        ...mockTicket,
        userName: 'John Doe',
        photoUrl: 'url',
        student: undefined,
      });
    });

    it('should throw if ticket not found', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(null);

      await expect(service.findTicketById('id', user)).rejects.toThrow(NotFoundException);
    });

    it("should throw if student accesses another user's ticket", async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue({ studentId: 'other-id' });

      await expect(service.findTicketById('id', user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('replyToTicket', () => {
    const user: GetUserType = {
      id: 'user-id',
      email: 'test@example.com',
      role: 'STUDENT',
    };

    it('should create reply and return response', async () => {
      const mockTicket = {
        id: 'ticket-1',
        studentId: 'user-id',
        title: 'Ticket Title',
        content: 'Ticket Content',
        status: 'PENDING',
        categoryId: 'cat-id',
        displayId: 'TKT-123',
        createdAt: new Date(),
        attachments: [],
        replies: [],
        student: {
          user: {
            firstName: 'John',
            lastName: 'Doe',
            photoUrl: 'url',
          },
        },
      };
      const attachments: Array<Express.Multer.File> = [
        { buffer: Buffer.from('file1') } as Express.Multer.File,
      ];
      const replyDto = {
        content: 'Reply',
        attachments,
      };

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);
      mockPrismaService.user.findUnique.mockResolvedValue({
        firstName: 'Jane',
        lastName: 'Smith',
        photoUrl: 'img',
      });
      mockPrismaService.ticketReply.create.mockResolvedValue({
        id: 'reply-id',
        content: replyDto.content,
        attachments: [
          {
            fileUrl: 'upload.jpg',
            uploadedAt: new Date(),
          },
        ],
      });

      const result = await service.replyToTicket(mockTicket.id, attachments, replyDto, user);

      expect(result.id).toBe('reply-id');
      expect(result.content).toBe('Reply');
      expect(result.userName).toBe('Smith Jane');
      expect(result.photoUrl).toBe('img');
      expect(result.attachments).toHaveLength(1);
      expect(result.attachments[0]).toEqual({
        fileUrl: 'upload.jpg',
        uploadedAt: expect.any(Date),
      });
    });

    it('should throw if ticket not found', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(null);

      await expect(
        service.replyToTicket('ticket-id', [], { content: '', attachments: [] }, user)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTicketStatus', () => {
    it('should update status and return mapped ticket', async () => {
      const mockUpdatedTicket = {
        id: 'ticket-1',
        studentId: 'user-id',
        title: 'Ticket Title',
        content: 'Ticket Content',
        status: 'PROCESSING',
        categoryId: 'cat-id',
        displayId: 'TKT-123',
        createdAt: new Date(),
        attachments: [],
        replies: [],
        student: {
          user: {
            firstName: 'John',
            lastName: 'Doe',
            photoUrl: 'url',
          },
        },
      };
      const dto: UpdateTicketStatusDto = {
        status: 'PROCESSING',
      };
      mockPrismaService.ticket.update.mockResolvedValue(mockUpdatedTicket);

      const result = await service.updateTicketStatus(mockUpdatedTicket.id, dto);

      expect(result.status).toBe('PROCESSING');
      expect(result.id).toBe('ticket-1');
      expect(result.title).toBe('Ticket Title');
      expect(result.content).toBe('Ticket Content');
      expect(result.displayId).toBe('TKT-123');
      expect(result.attachments).toHaveLength(0);
      expect(result.replies).toHaveLength(0);
      expect(result.userName).toBe('John Doe');
      expect(result.photoUrl).toBe('url');
      expect(result.studentId).toBe('user-id');
      expect(result.categoryId).toBe('cat-id');
    });
  });
});
