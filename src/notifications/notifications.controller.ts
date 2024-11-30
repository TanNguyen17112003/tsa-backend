import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CheckPushNotificationDto } from './dto/check-pushNoti.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RegisterPushNotificationDto } from './dto/register-pushNoti.dto';
import { UnregisterPushNotificationDto } from './dto/unregister-pushNoti.dto';
import { NotificationsService } from './notifications.service';

@Controller('api/notifications')
@ApiTags('Notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Send notification' })
  async sendNotification(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.sendNotification(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get notification list' })
  async getNotifications() {
    return this.notificationsService.getNotifications();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update notification status' })
  async updateNotificationStatus(@Param('id') id: string) {
    return this.notificationsService.updateNotificationStatus(id);
  }

  @Post('push/register')
  @ApiOperation({ summary: 'Register push notification' })
  async registerPushNotification(@Body() registerPushNotificationDto: RegisterPushNotificationDto) {
    return this.notificationsService.registerPushNotification(registerPushNotificationDto);
  }

  @Post('push/unregister')
  @ApiOperation({ summary: 'Unregister push notification' })
  async unregisterPushNotification(
    @Body() unregisterPushNotificationDto: UnregisterPushNotificationDto
  ) {
    return this.notificationsService.unregisterPushNotification(unregisterPushNotificationDto);
  }

  @Post('push/check')
  @ApiOperation({ summary: 'Check push notification' })
  async checkPushNotification(@Body() checkPushNotification: CheckPushNotificationDto) {
    return this.notificationsService.checkPushNotification(checkPushNotification);
  }
}
