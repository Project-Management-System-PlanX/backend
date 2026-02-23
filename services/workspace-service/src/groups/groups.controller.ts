import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupsService } from './groups.service';

@Controller('groups')
export class GroupsController {
    constructor(private readonly groupsService: GroupsService) {}

    @Post()
    create(@CurrentUser('userId') userId: string, @Body() createGroupDto: CreateGroupDto) {
        return this.groupsService.create(createGroupDto, userId);
    }

    @Get('channel/:channelId')
    findByChannel(@Param('channelId') channelId: string) {
        return this.groupsService.findByChannel(channelId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.groupsService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @CurrentUser('userId') userId: string,
        @Body() updateData: Partial<CreateGroupDto>,
    ) {
        return this.groupsService.update(id, updateData, userId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
        return this.groupsService.remove(id, userId);
    }

    @Post(':groupId/members')
    addMember(@Param('groupId') groupId: string, @Body() body: { userId: string }) {
        return this.groupsService.addMember(groupId, body.userId);
    }

    @Delete(':groupId/members/:userId')
    removeMember(@Param('groupId') groupId: string, @Param('userId') userId: string) {
        return this.groupsService.removeMember(groupId, userId);
    }
}
