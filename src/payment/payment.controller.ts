import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';

import { MomoRequestDto } from './dto/momo-request.dto';
import { PayOsRequestDto } from './dto/payos-request.dto';
import { PaymentService } from './payment.service';

@Controller('api/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('momo')
  async createMomo(@Body() createPaymentDto: MomoRequestDto, @Res() res: Response) {
    const paymentResponse = await this.paymentService.createMomoPayment(createPaymentDto);
    if (paymentResponse && paymentResponse.payUrl) {
      return res.json({ payUrl: paymentResponse.payUrl });
    } else {
      return res.status(400).json({ message: 'Failed to create Momo payment' });
    }
  }

  @Post('payos')
  async createPayOSPayment(@Body() createPaymentDto: PayOsRequestDto, @Res() res: Response) {
    const paymentResponse = await this.paymentService.createPayOSPayment(createPaymentDto);
    if (paymentResponse && paymentResponse.paymentLink.checkoutUrl) {
      return res.json({ paymentLink: paymentResponse.paymentLink });
    } else {
      return res.status(400).json({ message: 'Failed to create PayOS payment' });
    }
  }
  @Post('webhook-endpoint')
  async webhookEndpoint(@Body() body: any, @Res() res: Response) {
    await this.paymentService.handleWebhook(body);
    return res.status(200).json({ message: 'Webhook received' });
  }
}
