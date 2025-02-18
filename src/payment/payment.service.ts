import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PayOS from '@payos/node';
import { WebhookType } from '@payos/node/lib/type';
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
  private readonly payOS: PayOS;

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

    this.payOS = new PayOS(this.clientId, this.apiKey, this.checksumKey);
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
    const orderCode = Number(moment().format('X')) + Math.floor(Math.random() * 1000);
    const payOsOrder = {
      amount: createPaymentDto.amount,
      description: createPaymentDto.description,
      orderCode,
      returnUrl: createPaymentDto.returnUrl,
      cancelUrl: createPaymentDto.cancelUrl,
    };

    const paymentLink = await this.payOS.createPaymentLink(payOsOrder);
    await this.prisma.payment.create({
      data: {
        amount: createPaymentDto.amount,
        orderId: createPaymentDto.orderId,
        orderCode: orderCode.toString(),
      },
    });
    return { paymentLink };
  }

  async handleWebhook(body: WebhookType) {
    console.log('Received webhook', body);

    try {
      const isValid = this.payOS.verifyPaymentWebhookData(body);
      if (!isValid) {
        console.error('Invalid signature in webhook:', body);
        throw new Error('Invalid signature');
      }

      const {
        orderCode,
        amount,
        counterAccountName,
        counterAccountNumber,
        counterAccountBankName,
      } = body.data;

      if (orderCode === 123) {
        console.log('Ignoring test orderCode 123');
        return;
      }

      // Start a transaction to prevent race conditions
      const updatedOrder = await this.prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findFirst({
          where: { orderCode: orderCode.toString() },
        });
        if (!payment) throw new Error('Payment not found');

        const order = await tx.order.findUnique({
          where: { id: payment.orderId },
        });
        if (!order) throw new Error('Order not found');

        const newRemainingAmount = order.remainingAmount - amount;
        const isPaid = newRemainingAmount <= 0;

        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            remainingAmount: newRemainingAmount,
            isPaid,
          },
        });

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            isPaid: true,
            counterAccountName,
            counterAccountNumber,
            counterAccountBankName,
          },
        });

        return updatedOrder;
      });

      const title = updatedOrder.isPaid ? 'Thanh toán thành công' : 'Thanh toán một phần';
      const content = updatedOrder.isPaid
        ? `Đơn hàng ${updatedOrder.id} đã được thanh toán thành công`
        : `Đã thanh toán ${amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })} 
           cho đơn hàng ${updatedOrder.id}. Còn lại ${updatedOrder.remainingAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}`;

      await this.notificationService.sendNotification({
        title,
        type: 'ORDER',
        content,
        userId: updatedOrder.studentId,
        orderId: updatedOrder.id,
        deliveryId: null,
        reportId: null,
      });

      await this.notificationService.sendPushNotification({
        message: { title, message: content },
        userId: updatedOrder.studentId,
      });

      this.paymentGateway.notifyPaymentUpdate(updatedOrder.id, {
        orderId: updatedOrder.id,
        isPaid: updatedOrder.isPaid,
        remainingAmount: updatedOrder.remainingAmount,
      });

      console.log(`Payment successfully processed for order ${updatedOrder.id}`);
    } catch (error) {
      console.error('Error processing webhook:', error);
    }
  }
}
