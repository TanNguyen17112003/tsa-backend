import { CheckoutResponseDataType, WebhookType } from '@payos/node/lib/type';

import { MomoRequestDto } from './dto/momo-request.dto';
import { PayOsRequestDto } from './dto/payos-request.dto';

export abstract class PaymentService {
  abstract createMomoPayment(createPaymentDto: MomoRequestDto): Promise<any>;

  abstract createPayOSPayment(
    createPaymentDto: PayOsRequestDto
  ): Promise<{ paymentLink: CheckoutResponseDataType }>;

  abstract handleWebhook(body: WebhookType): Promise<void>;
}
