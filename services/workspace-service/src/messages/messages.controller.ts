import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @Post()
    create(
        @CurrentUser('userId') userId: string,
        @Body() body: {
            channelId: string;
            content: string | null;
            fileUrl?: string;
            fileName?: string;
            fileType?: string;
            fileSize?: number;
        },
    ) {
        const fileDetails = body.fileUrl
            ? {
                fileUrl: body.fileUrl,
                fileName: body.fileName || '',
                fileType: body.fileType || '',
                fileSize: body.fileSize || 0,
            }
            : undefined;

        return this.messagesService.create(body.channelId, userId, body.content, fileDetails);
    }

    @Get('channel/:channelId')
    findByChannel(
        @Param('channelId') channelId: string,
        @Query('limit') limit?: string,
    ) {
        return this.messagesService.findByChannel(channelId, limit ? parseInt(limit, 10) : 50);
    }

    @Get('unread-counts/:workspaceId')
    async getUnreadCounts(
        @Param('workspaceId') workspaceId: string,
        @CurrentUser('userId') userId: string,
    ) {
        return this.messagesService.getUnreadCounts(workspaceId, userId);
    }

    @Post('mark-read/:channelId')
    async markChannelAsRead(
        @Param('channelId') channelId: string,
        @CurrentUser('userId') userId: string,
        @Body() body: { lastMessageId: string },
    ) {
        return this.messagesService.markChannelAsRead(channelId, userId, body.lastMessageId);
    }
}
