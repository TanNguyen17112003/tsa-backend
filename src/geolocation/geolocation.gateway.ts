import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { NextFunction } from 'express';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma';
import type { TServer, TSocket } from 'src/types/socket.d.ts';

import { LocationUpdateDto } from './dtos/location-update.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class GeolocationGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: TServer;

  private clients: { [key: string]: Socket } = {};

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
    this.clients[client.id] = client;
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
    delete this.clients[client.id];
  }

  afterInit(server: Server) {
    server.engine.use(async (req: any, res: any, next: NextFunction) => {
      const isHandshake = req._query.sid === undefined;

      if (isHandshake) {
        const [type, token] = req.headers.authorization?.split(' ') ?? [];
        if (type !== 'Bearer' || !token) {
          return next(new WsException('Phiên đăng nhập không hợp lệ.'));
        }
        try {
          const user = await this.jwtService.verify(token);
          req['user'] = user;
        } catch (err) {
          return next(new WsException('Phiên đăng nhập không hợp lệ.'));
        }
      }

      next();
    });
  }

  @SubscribeMessage('subscribeToShipper')
  handleSubscribeToShipper(
    @MessageBody() { shipperId }: { shipperId: string },
    @ConnectedSocket() socket: Socket
  ) {
    // Student subscribes to get real-time location updates of staff (shipper)
    socket.join(this.getRoom(shipperId));
    console.log(`Client ${socket.id} subscribed to shipper with ID ${shipperId}`);
  }

  @SubscribeMessage('unsubscribeFromShipper')
  handleUnsubscribeFromOrder(
    @MessageBody() { shipperId }: { shipperId: string },
    @ConnectedSocket() socket: Socket
  ) {
    // Student (should) unsubscribes when leaving the map page
    socket.leave(this.getRoom(shipperId));
    console.log(`Client ${socket.id} unsubscribed from shipper with ID ${shipperId}`);
  }

  @SubscribeMessage('locationUpdate')
  async handleEvent(@MessageBody() data: LocationUpdateDto, @ConnectedSocket() socket: TSocket) {
    // Staff who is delivering this order emits their location updates
    const { orderId, ...locationData } = data;
    const shipperId = data.staffId;

    if (!(await this.isStaffAuthorizedToUpdateLocation(shipperId, orderId))) {
      throw new WsException('Bạn không có quyền cập nhật vị trí cho đơn hàng này.');
    }

    socket.to(this.getRoom(shipperId)).emit('locationUpdate', locationData);
    console.log(`Staff ${shipperId} emitted location update for order ${orderId}`);
  }

  private getRoom(shipperId: string) {
    return `shipper:${shipperId}`;
  }

  private async isStaffAuthorizedToUpdateLocation(
    staffId: string,
    orderId: string
  ): Promise<boolean> {
    // Return true if the staff is assigned to deliver this order
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        shipperId: staffId,
      },
    });

    return !!order;
  }
}
