import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PayOS from '@payos/node';
import axios from 'axios';
import * as crypto from 'crypto';
import moment from 'moment';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PrismaService } from 'src/prisma';
import { v4 as uuidv4 } from 'uuid';

import { MomoRequestDto } from './dto/momo-request.dto';
import { PayOsRequestDto } from './dto/payos-request.dto';
import { PaymentGateway } from './payment.gateway';

@Injectable()
export class PaymentService {
  private readonly partnerCode: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly endpoint: string;
  private readonly clientId: string;
  private readonly apiKey: string;
  private readonly checksumKey: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private notificationService: NotificationsService,
    private paymentGateway: PaymentGateway
  ) {
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
    const order = await this.prisma.order.findUnique({
      where: {
        id: createPaymentDto.orderId,
      },
    });
    if (!order) {
      throw new Error('Order not found');
    }
    const payos = new PayOS(this.clientId, this.apiKey, this.checksumKey);
    const orderCode = Number(moment().format('X')) + Math.floor(Math.random() * 1000);
    const payOsOrder = {
      amount: createPaymentDto.amount,
      description: createPaymentDto.description,
      orderCode,
      returnUrl: createPaymentDto.returnUrl,
      cancelUrl: createPaymentDto.cancelUrl,
    };
    const paymentLink = await payos.createPaymentLink(payOsOrder);
    await this.prisma.payment.create({
      data: {
        amount: createPaymentDto.amount,
        orderId: createPaymentDto.orderId,
        orderCode: orderCode.toString(),
      },
    });
    return { paymentLink };
  }
  async handleWebhook(body: any) {
    console.log('Received webhook', body);
    const data = body.data;
    const { orderCode, amount, counterAccountName, counterAccountNumber, counterAccountBankName } =
      data;
    if (orderCode === 123) {
      return;
    }
    const payment = await this.prisma.payment.findFirst({
      where: {
        orderCode: orderCode.toString(),
      },
    });
    if (!payment) {
      throw new Error('Payment not found');
    }
    const order = await this.prisma.order.findUnique({
      where: {
        id: payment.orderId,
      },
    });
    if (!order) {
      throw new Error('Order not found');
    }
    const updatedOrder = await this.prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        remainingAmount: order.remainingAmount - amount,
        isPaid: order.remainingAmount - amount <= 0,
      },
    });
    await this.prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        isPaid: true,
        counterAccountName,
        counterAccountNumber,
        counterAccountBankName,
      },
    });
    const title =
      order.remainingAmount - amount <= 0 ? 'Thanh toán thành công' : 'Thanh toán một phần';
    const content =
      order.remainingAmount - amount <= 0
        ? `Đơn hàng ${order.id} đã được thanh toán thành công`
        : `Đã thanh toán ${amount.toLocaleString('vi-VN', {
            style: 'currency',
            currency: 'VND',
          })} cho đơn hàng ${order.id}. Còn lại ${order.remainingAmount.toLocaleString('vi-VN', {
            style: 'currency',
            currency: 'VND',
          })}`;

    await this.notificationService.sendNotification({
      title,
      type: 'ORDER',
      content,
      userId: order.studentId,
      orderId: order.id,
      deliveryId: null,
      reportId: null,
    });
    await this.notificationService.sendPushNotification({
      message: {
        title,
        message: content,
      },
      userId: order.studentId,
    });
    this.paymentGateway.notifyPaymentUpdate(order.id, {
      orderId: order.id,
      isPaid: updatedOrder.isPaid,
      remainingAmount: updatedOrder.remainingAmount,
    });
  }
}
