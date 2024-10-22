import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PayOS from '@payos/node';
import axios from 'axios';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

import { MomoRequestDto } from './dto/momo-request.dto';
import { PayOsRequestDto } from './dto/payos-request.dto';

@Injectable()
export class PaymentService {
  private readonly partnerCode: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly endpoint: string;
  private readonly clientId: string;
  private readonly apiKey: string;
  private readonly checksumKey: string;

  constructor(private configService: ConfigService) {
    this.partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE');
    this.accessKey = this.configService.get<string>('MOMO_ACCESS_KEY');
    this.secretKey = this.configService.get<string>('MOMO_SECRET_KEY');
    this.endpoint = this.configService.get<string>('MOMO_ENDPOINT');
    this.clientId = this.configService.get<string>('PAYOS_CLIENT_ID');
    this.apiKey = this.configService.get<string>('PAYOS_API_KEY');
    this.checksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY');
  }

  async createMomoPayment(createPaymentDto: MomoRequestDto) {
    const requestId = uuidv4();
    const requestType = 'captureMoMoWallet';
    const extraData = createPaymentDto.extraData || '';

    const rawSignature = `partnerCode=${this.partnerCode}&accessKey=${this.accessKey}&requestId=${requestId}&amount=${createPaymentDto.amount}&orderId=${createPaymentDto.orderId}&orderInfo=${createPaymentDto.orderInfo}&returnUrl=${createPaymentDto.returnUrl}&notifyUrl=${createPaymentDto.notifyUrl}&extraData=${extraData}`;
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');
    const requestBody = {
      partnerCode: this.partnerCode,
      accessKey: this.accessKey,
      requestId,
      amount: createPaymentDto.amount,
      orderId: createPaymentDto.orderId,
      orderInfo: createPaymentDto.orderInfo,
      returnUrl: createPaymentDto.returnUrl,
      notifyUrl: createPaymentDto.notifyUrl,
      extraData,
      requestType,
      signature,
    };

    const response = await axios.post(this.endpoint, requestBody);
    return response.data;
  }

  async createPayOSPayment(createPaymentDto: PayOsRequestDto) {
    const payos = new PayOS(this.clientId, this.apiKey, this.checksumKey);
    const order = {
      amount: createPaymentDto.amount,
      description: createPaymentDto.description,
      orderCode: Math.floor(Math.random() * 100000) + 1,
      returnUrl: createPaymentDto.returnUrl,
      cancelUrl: createPaymentDto.cancelUrl,
    };
    const paymentLink = await payos.createPaymentLink(order);
    return { paymentLink };
  }
}
