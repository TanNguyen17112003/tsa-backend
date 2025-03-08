import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth, GetUser } from 'src/auth';
import { GetUserType } from 'src/types';

import { CheckPushNotificationDto } from './dto/check-pushNoti.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RegisterPushNotificationDto } from './dto/register-pushNoti.dto';
import { UnregisterPushNotificationDto } from './dto/unregister-pushNoti.dto';
import { NotificationsService } from './notifications.service';

@Controller('api/notifications')
@ApiTags('Notifications')
@Auth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Send notification' })
  async sendNotification(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.sendNotification(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get notification list' })
  async getNotifications(@GetUser() user: GetUserType) {
    return this.notificationsService.getNotifications(user);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllNotificationsAsRead(@GetUser() user: GetUserType) {
    return this.notificationsService.markAllNotificationsAsRead(user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update notification status' })
  async updateNotificationStatus(@Param('id') id: string, @GetUser() user: GetUserType) {
    return this.notificationsService.updateNotificationStatus(id, user);
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
