import { Test, TestingModule } from '@nestjs/testing';
import { GetUserType } from 'src/types';

import { CreateTicketDto, ReplyTicketDto, TicketQueryDto, UpdateTicketStatusDto } from './dto';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

describe('TicketsController', () => {
  let controller: TicketsController;
  let service: TicketsService;

  const mockTicketsService = {
    createTicket: jest.fn(),
    findAllTickets: jest.fn(),
    createCategory: jest.fn(),
    findAllCategories: jest.fn(),
    findTicketById: jest.fn(),
    replyToTicket: jest.fn(),
    updateTicketStatus: jest.fn(),
  };
  const mockUser: GetUserType = {
    id: 'user1',
    email: 'test@example.com',
    role: 'STUDENT',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        {
          provide: TicketsService,
          useValue: mockTicketsService,
        },
      ],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
    service = module.get<TicketsService>(TicketsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTicket', () => {
    it('should create a new ticket', async () => {
      const attachments = [];
      const dto: CreateTicketDto = {
        title: 'Title',
        content: 'Content',
        categoryId: 'cat-id',
        attachments,
      };
      mockTicketsService.createTicket.mockResolvedValue({} as any);

      await controller.createTicket(attachments, dto, mockUser);

      expect(service.createTicket).toHaveBeenCalledWith(attachments, dto, mockUser.id);
    });
  });

  describe('findAllTickets', () => {
    it('should get all tickets with status filtering', async () => {
      const query: TicketQueryDto = {
        status: 'PENDING',
      };
      mockTicketsService.findAllTickets.mockResolvedValue([]);

      await controller.findAllTickets(query, mockUser);

      expect(service.findAllTickets).toHaveBeenCalledWith(query, mockUser);
    });
  });

  describe('createCategory', () => {
    it('should create a new category', async () => {
      const dto = { name: 'Tech' };
      mockTicketsService.createCategory.mockResolvedValue({ id: 'cat-id', name: 'Tech' });

      const result = await controller.createCategory(dto);

      expect(service.createCategory).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 'cat-id', name: 'Tech' });
    });
  });

  describe('findAllCategories', () => {
    it('should find all categories', async () => {
      mockTicketsService.findAllCategories.mockResolvedValue([{ id: 'cat1', name: 'Bug' }]);
      const result = await controller.findAllCategories();

      expect(service.findAllCategories).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('findTicketById', () => {
    it('should get a ticket by id', async () => {
      mockTicketsService.findTicketById.mockResolvedValue({ id: 't1' } as any);

      const result = await controller.findTicketById('t1', mockUser);

      expect(service.findTicketById).toHaveBeenCalledWith('t1', mockUser);
      expect(result.id).toBe('t1');
    });
  });

  describe('replyToTicket', () => {
    it('should reply to an existing ticket', async () => {
      const attachments = [] as any;
      const dto: ReplyTicketDto = {
        content: 'Thanks!',
        attachments,
      };
      mockTicketsService.replyToTicket.mockResolvedValue({ content: 'Thanks!' } as any);

      const result = await controller.replyToTicket('ticket-id', attachments, dto, mockUser);

      expect(service.replyToTicket).toHaveBeenCalledWith('ticket-id', attachments, dto, mockUser);
      expect(result.content).toBe('Thanks!');
    });
  });

  describe('updateTicketStatus', () => {
    it('should call service.updateTicketStatus with id and dto', async () => {
      const dto: UpdateTicketStatusDto = { status: 'CLOSED' };

      mockTicketsService.updateTicketStatus.mockResolvedValue({
        id: 'ticket-id',
        status: 'CLOSED',
      } as any);

      const result = await controller.updateTicketStatus('ticket-id', dto);

      expect(service.updateTicketStatus).toHaveBeenCalledWith('ticket-id', dto);
      expect(result.status).toBe('CLOSED');
    });
  });
});
