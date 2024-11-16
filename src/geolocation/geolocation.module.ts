import { Module } from '@nestjs/common';

import { GeolocationGateway } from './geolocation.gateway';

@Module({
  providers: [GeolocationGateway],
})
export class GeolocationModule {}
