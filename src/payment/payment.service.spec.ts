import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { NotificationsService } from 'src/notifications';
import { PrismaService } from 'src/prisma';
import { v4 as uuidv4 } from 'uuid';

import { MomoRequestDto } from './dto/momo-request.dto';
import { PaymentGateway } from './payment.gateway';
import { PaymentServiceImpl } from './payment.service.impl';

jest.mock('axios');
jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-request-id') }));

const mockPayOS = {
  createPaymentLink: jest.fn(),
  verifyPaymentWebhookData: jest.fn(),
};
jest.mock('@payos/node', () => {
  return jest.fn().mockImplementation(() => mockPayOS);
});

describe('PaymentServiceImpl', () => {
  let service: PaymentServiceImpl;
  let prisma: PrismaService;

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockNotificationsService = {
    sendNotification: jest.fn(),
    sendPushNotification: jest.fn(),
  };

  const mockPaymentGateway = {
    notifyPaymentUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentServiceImpl,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-value'),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: PaymentGateway,
          useValue: mockPaymentGateway,
        },
      ],
    }).compile();

    service = module.get<PaymentServiceImpl>(PaymentServiceImpl);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('createMomoPayment', () => {
    it('should return Momo payment response', async () => {
      const dto: MomoRequestDto = {
        amount: '100000',
        orderId: 'order123',
        orderInfo: 'Test order',
        returnUrl: 'https://return.url',
        notifyUrl: 'https://notify.url',
        extraData: 'extra',
      };

      (axios.post as jest.Mock).mockResolvedValue({ data: { payUrl: 'https://pay.url' } });

      const result = await service.createMomoPayment(dto);

      expect(axios.post).toHaveBeenCalled();
      expect(result).toEqual({ payUrl: 'https://pay.url' });
      expect(uuidv4).toHaveBeenCalled();
    });
  });

  describe('createPayOSPayment', () => {
    it('should create payment and return PayOS link', async () => {
      const dto = {
        amount: 200000,
        orderId: 'order123',
        description: 'Test payment',
        returnUrl: 'https://return.url',
        cancelUrl: 'https://cancel.url',
      };

      const mockOrder = { id: 'order123' };
      const mockLink = 'https://payos.link';

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (mockPayOS.createPaymentLink as jest.Mock).mockResolvedValue(mockLink);

      const result = await service.createPayOSPayment(dto);

      expect(prisma.payment.create).toHaveBeenCalled();
      expect(result).toEqual({ paymentLink: mockLink });
    });

    it('should throw error if order not found', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createPayOSPayment({
          amount: 1000,
          orderId: 'nonexistent',
          description: '',
          returnUrl: '',
          cancelUrl: '',
        })
      ).rejects.toThrow('Order not found');
    });
  });

  describe('handleWebhook', () => {
    it('should process webhook and update payment/order', async () => {
      const webhookBody: any = {
        data: {
          orderCode: 999,
          amount: 100000,
          counterAccountName: 'Test Name',
          counterAccountNumber: '123456789',
          counterAccountBankName: 'Test Bank',
        },
      };

      (mockPayOS.verifyPaymentWebhookData as jest.Mock).mockReturnValue(true);

      const mockPayment = {
        id: 'payment123',
        orderId: 'order123',
      };
      const mockOrder = {
        id: 'order123',
        remainingAmount: 100000,
        isPaid: false,
        studentId: 'student123',
      };
      const updatedOrder = {
        ...mockOrder,
        remainingAmount: 0,
        isPaid: true,
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (fn) =>
        fn({
          payment: {
            findFirst: jest.fn().mockResolvedValue(mockPayment),
            update: jest.fn(),
          },
          order: {
            findUnique: jest.fn().mockResolvedValue(mockOrder),
            update: jest.fn().mockResolvedValue(updatedOrder),
          },
        })
      );

      await service.handleWebhook(webhookBody);

      expect(mockPayOS.verifyPaymentWebhookData).toHaveBeenCalledWith(webhookBody);
    });

    it('should ignore webhook with orderCode 123', async () => {
      const webhookBody: any = {
        data: { orderCode: 123 },
      };

      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      await service.handleWebhook(webhookBody);
      expect(logSpy).toHaveBeenCalledWith('Ignoring test orderCode 123');
    });

    it('should log error on invalid signature', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (mockPayOS.verifyPaymentWebhookData as jest.Mock).mockReturnValue(false);

      await service.handleWebhook({ data: { orderCode: 456 } } as any);
      expect(errorSpy).toHaveBeenCalledWith('Invalid signature in webhook:', {
        data: { orderCode: 456 },
      });
    });
  });
});
