import { Notification, Prisma } from '@prisma/client';
import { GetUserType } from 'src/types';

import {
  CheckPushNotificationDto,
  CheckPushNotificationResponseDto,
} from './dto/check-pushNoti.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { GetNotificationsDto } from './dto/get-notification.dto';
import { RegisterPushNotificationDto } from './dto/register-pushNoti.dto';
import { UnregisterPushNotificationDto } from './dto/unregister-pushNoti.dto';

export abstract class NotificationsService {
  abstract sendNotification(createNotificationDto: CreateNotificationDto): Promise<Notification>;
  abstract getNotifications(user: GetUserType): Promise<GetNotificationsDto>;
  abstract updateNotificationStatus(id: string, user: GetUserType): Promise<Notification>;
  abstract markAllNotificationsAsRead(user: GetUserType): Promise<Prisma.BatchPayload>;
  abstract sendPushNotification(userId: string, message: PushNotificationMessage): Promise<void>;

  abstract registerPushNotification(
    registerPushNotificationDto: RegisterPushNotificationDto
  ): Promise<void>;
  abstract unregisterPushNotification(
    unregisterPushNotificationDto: UnregisterPushNotificationDto
  ): Promise<void>;
  abstract checkPushNotification(
    checkPushNotification: CheckPushNotificationDto
  ): Promise<CheckPushNotificationResponseDto>;

  abstract sendFullNotification({
    userId,
    type,
    title,
    message,
    orderId,
    deliveryId,
    reportId,
  }: {
    userId: string;
    type: 'ORDER' | 'DELIVERY' | 'REPORT'; // mở rộng nếu cần
    title: string;
    message: string;
    orderId?: string;
    deliveryId?: string;
    reportId?: string;
  }): Promise<void>;

  abstract sendPushNotificationForDevice(
    deviceToken: string,
    message: PushNotificationMessage,
    _userId: string
  ): Promise<void>;
}
