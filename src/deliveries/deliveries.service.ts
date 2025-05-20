import { Delivery } from '@prisma/client';
import { GetUserType } from 'src/types';

import {
  CreateDeliveryDto,
  GetDeliveriesDto,
  GetDeliveryDto,
  UpdateDeliveryDto,
  UpdateStatusDto,
} from './dtos';

export abstract class DeliveriesService {
  abstract createDelivery(createDeliveryDto: CreateDeliveryDto): Promise<Delivery>;
  abstract getDeliveries(user: GetUserType): Promise<GetDeliveriesDto[]>;
  abstract getDelivery(id: string): Promise<GetDeliveryDto>;
  abstract updateDelivery(id: string, updateDeliveryDto: UpdateDeliveryDto): Promise<Delivery>;
  abstract updateDeliveryStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
    user: GetUserType
  ): Promise<Delivery>;
  abstract deleteDelivery(id: string): Promise<Delivery>;
}
