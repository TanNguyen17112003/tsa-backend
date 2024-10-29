import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreateNotificationDto } from './dto/create-notification.dto';
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
}
