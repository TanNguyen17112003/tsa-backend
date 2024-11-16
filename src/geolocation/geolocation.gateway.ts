import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class GeolocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private clients: { [key: string]: Socket } = {};

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
    this.clients[client.id] = client;
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
    delete this.clients[client.id];
  }

  @SubscribeMessage('subscribeToOrder')
  handleSubscribeToOrder(
    @MessageBody() { orderId }: { orderId: string },
    @ConnectedSocket() socket: Socket
  ) {
    // Student subscribes to get real-time location updates of staff
    socket.join(`order_${orderId}`);
    console.log(`Client ${socket.id} subscribed to order ${orderId}`);
  }

  @SubscribeMessage('unsubscribeFromOrder')
  handleUnsubscribeFromOrder(
    @MessageBody() { orderId }: { orderId: string },
    @ConnectedSocket() socket: Socket
  ) {
    // Student (should) unsubscribes when leaving the map page
    socket.leave(`order_${orderId}`);
    console.log(`Client ${socket.id} unsubscribed from order ${orderId}`);
  }

  @SubscribeMessage('locationUpdate')
  handleEvent(
    @MessageBody() data: { orderId: string; staffId: string; latitude: number; longitude: number },
    @ConnectedSocket() socket: Socket
  ) {
    // Staff who is delivering this order emits their location updates
    // Will implement auth to check if the staff is allowed to emit location updates for the order
    socket.to(`order_${data.orderId}`).emit('locationUpdate', data);
    console.log(`Client ${socket.id} emitted location update for order ${data.orderId}`);
  }
}
