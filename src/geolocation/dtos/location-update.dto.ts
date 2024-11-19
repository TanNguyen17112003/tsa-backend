import { IsNumber, IsString } from 'class-validator';

export class LocationUpdateDto {
  @IsString()
  orderId: string;

  @IsString()
  staffId: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}
