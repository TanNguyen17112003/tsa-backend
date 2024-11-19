import { Server, Socket } from 'socket.io';
import { LocationUpdateDto } from 'src/geolocation/dtos/location-update.dto';

interface ServerToClientEvents {
  locationUpdate: (data: LocationUpdateDto) => void;
}

interface ClientToServerEvents {
  subscribeToShipper: (data: { shipperId: string }) => void;
  unsubscribeFromShipper: (data: { shipperId: string }) => void;
  locationUpdate: (data: Omit<LocationUpdateDto, 'orderId'>) => void;
}

type TServer = Server<ServerToClientEvents, ClientToServerEvents>;
type TSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
