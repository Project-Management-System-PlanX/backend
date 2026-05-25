// src/notifications/notifications.controller.ts
import { Controller, Get, Patch, Param } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    findAll(@CurrentUser('userId') userId: string) {
        return this.notificationsService.findAll(userId);
    }

    @Get('unread-count')
    unreadCount(@CurrentUser('userId') userId: string) {
        return this.notificationsService.getUnreadCount(userId);
    }

    @Patch(':id/read')
    markRead(@Param('id') id: string, @CurrentUser('userId') userId: string) {
        return this.notificationsService.markRead(id, userId);
    }

    @Patch('read-all')
    markAllRead(@CurrentUser('userId') userId: string) {
        return this.notificationsService.markAllRead(userId);
    }
}