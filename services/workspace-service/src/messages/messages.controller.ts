import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { MessagesService } from './messages.service';
import { ReadStateService } from './read-state.service';

@Controller('messages')
export class MessagesController {
    constructor(
        private readonly messagesService: MessagesService,
        private readonly readStateService: ReadStateService,
    ) {}

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
            duration?: number;
            parentId?: string;
        },
    ) {
        const fileDetails = body.fileUrl
            ? {
                  fileUrl: body.fileUrl,
                  fileName: body.fileName || '',
                  fileType: body.fileType || '',
                  fileSize: body.fileSize || 0,
                  duration: body.duration,
              }
            : undefined;

        return this.messagesService.create(
            body.channelId,
            userId,
            body.content,
            fileDetails,
            body.parentId,
        );
    }

    @Get('channel/:channelId')
    findByChannel(@Param('channelId') channelId: string, @Query('limit') limit?: string) {
        return this.messagesService.findByChannel(channelId, limit ? parseInt(limit, 10) : 50);
    }

    @Get('workspace/:workspaceId/files')
    findFilesByWorkspace(@Param('workspaceId') workspaceId: string) {
        return this.messagesService.findFilesByWorkspace(workspaceId);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @CurrentUser('userId') userId: string) {
        return this.messagesService.softDelete(id, userId);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @CurrentUser('userId') userId: string,
        @Body() body: { content: string },
    ) {
        return this.messagesService.update(id, userId, body.content);
    }

    @Patch(':id/pin')
    togglePin(
        @Param('id') id: string,
        @CurrentUser('userId') userId: string,
        @Body() body: { isPinned: boolean },
    ) {
        return this.messagesService.togglePin(id, userId, body.isPinned);
    }

    // ── Read State Endpoints ──

    @Post('read')
    markAsRead(
        @CurrentUser('userId') userId: string,
        @Body() body: { channelId: string; messageId?: string },
    ) {
        return this.readStateService.markAsRead(body.channelId, userId, body.messageId);
    }

    @Get('unread-counts/:workspaceId')
    getUnreadCounts(
        @CurrentUser('userId') userId: string,
        @Param('workspaceId') workspaceId: string,
    ) {
        return this.readStateService.getUnreadCounts(userId, workspaceId);
    }

    @Get('read-state/:channelId')
    getReadState(@CurrentUser('userId') userId: string, @Param('channelId') channelId: string) {
        return this.readStateService.getReadState(channelId, userId);
    }
}
