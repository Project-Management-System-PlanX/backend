import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';

@Controller('channels')
export class ChannelsController {
    constructor(private readonly channelsService: ChannelsService) {}

    @Post()
    create(@Body() createChannelDto: CreateChannelDto) {
        return this.channelsService.create(createChannelDto);
    }

    @Get('workspace/:workspaceId')
    findByWorkspace(@Param('workspaceId') workspaceId: string) {
        return this.channelsService.findByWorkspace(workspaceId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.channelsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateData: Partial<CreateChannelDto>) {
        return this.channelsService.update(id, updateData);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.channelsService.remove(id);
    }

    @Post(':channelId/members')
    addMember(
        @Param('channelId') channelId: string,
        @Body() body: { userId: string; role?: string },
    ) {
        return this.channelsService.addMember(channelId, body.userId, body.role);
    }

    @Delete(':channelId/members/:userId')
    removeMember(@Param('channelId') channelId: string, @Param('userId') userId: string) {
        return this.channelsService.removeMember(channelId, userId);
    }
}
