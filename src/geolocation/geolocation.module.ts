import { Module } from '@nestjs/common';
import { OrdersModule } from 'src/orders';

import { GeolocationGateway } from './geolocation.gateway';

@Module({
  imports: [OrdersModule],
  providers: [GeolocationGateway],
})
export class GeolocationModule {}
