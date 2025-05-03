import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';

import { MomoRequestDto } from './dto/momo-request.dto';
import { PayOsRequestDto } from './dto/payos-request.dto';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

describe('PaymentController', () => {
  let controller: PaymentController;

  const mockPaymentService = {
    createMomoPayment: jest.fn(),
    createPayOSPayment: jest.fn(),
    handleWebhook: jest.fn(),
  };

  const mockResponse = () => {
    const res: Partial<Response> = {
      status: jest.fn(function (_code) {
        return this;
      }),
      json: jest.fn(),
    };
    return res as Response;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMomo', () => {
    it('should return payUrl if payment creation is successful', async () => {
      const dto: MomoRequestDto = {
        amount: '100000',
        orderId: 'order1',
        orderInfo: 'Test Order',
        returnUrl: 'https://return.url',
        notifyUrl: 'https://notify.url',
        extraData: 'extra',
      };

      const res = mockResponse();
      mockPaymentService.createMomoPayment.mockResolvedValue({ payUrl: 'https://pay.url' });

      await controller.createMomo(dto, res);

      expect(res.json).toHaveBeenCalledWith({ payUrl: 'https://pay.url' });
    });

    it('should return 400 if Momo payment fails', async () => {
      const res = mockResponse();
      mockPaymentService.createMomoPayment.mockResolvedValue(null);

      await controller.createMomo({} as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to create Momo payment' });
    });
  });

  describe('createPayOSPayment', () => {
    it('should return paymentLink if successful', async () => {
      const dto: PayOsRequestDto = {
        amount: 200000,
        orderId: 'order2',
        description: 'Order Description',
        returnUrl: 'https://return.url',
        cancelUrl: 'https://cancel.url',
      };

      const res = mockResponse();
      mockPaymentService.createPayOSPayment.mockResolvedValue({
        paymentLink: {
          checkoutUrl: 'https://checkout.url',
        },
      });

      await controller.createPayOSPayment(dto, res);

      expect(res.json).toHaveBeenCalledWith({
        paymentLink: { checkoutUrl: 'https://checkout.url' },
      });
    });

    it('should return 400 if PayOS payment fails', async () => {
      const res = mockResponse();
      mockPaymentService.createPayOSPayment.mockResolvedValue(null);

      await controller.createPayOSPayment({} as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to create PayOS payment' });
    });
  });

  describe('webhookEndpoint', () => {
    it('should handle webhook and return 200', async () => {
      const res = mockResponse();
      const body = { data: 'webhook' };

      await controller.webhookEndpoint(body, res);

      expect(mockPaymentService.handleWebhook).toHaveBeenCalledWith(body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Webhook received' });
    });
  });
});
