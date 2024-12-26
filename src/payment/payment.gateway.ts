import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
@Injectable()
export class PaymentGateway {
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}

  @SubscribeMessage('subscribeToPayment')
  handleSubscribeToPayment(
    @MessageBody() { orderId }: { orderId: string },
    @ConnectedSocket() client: Socket
  ) {
    client.join(this.getPaymentRoom(orderId));
    console.log(`Client ${client.id} subscribed to updates for order ${orderId}`);
  }

  @SubscribeMessage('unsubscribeFromPayment')
  handleUnsubscribeFromPayment(
    @MessageBody() { orderId }: { orderId: string },
    @ConnectedSocket() client: Socket
  ) {
    client.leave(this.getPaymentRoom(orderId));
    console.log(`Client ${client.id} unsubscribed from updates for order ${orderId}`);
  }

  notifyPaymentUpdate(orderId: string, data: any) {
    this.server.to(this.getPaymentRoom(orderId)).emit('paymentUpdate', data);
    console.log(`Emitted payment update for order ${orderId}`);
  }

  private getPaymentRoom(orderId: string): string {
    return `payment:${orderId}`;
  }
}
