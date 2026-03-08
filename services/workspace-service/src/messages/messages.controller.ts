import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) {}

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

        return this.messagesService.create(body.channelId, userId, body.content, fileDetails);
    }

    @Get('channel/:channelId')
    findByChannel(@Param('channelId') channelId: string, @Query('limit') limit?: string) {
        return this.messagesService.findByChannel(channelId, limit ? parseInt(limit, 10) : 50);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @CurrentUser('userId') userId: string) {
        return this.messagesService.softDelete(id, userId);
    }
}
