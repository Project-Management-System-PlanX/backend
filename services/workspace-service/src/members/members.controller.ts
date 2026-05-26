import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { MembersService } from './members.service';

@Controller('workspaces/:workspaceId/members')
export class MembersController {
    constructor(private readonly membersService: MembersService) {}

    @Post()
    addMember(
        @Param('workspaceId') workspaceId: string,
        @CurrentUser('userId') requesterId: string,
        @Body() body: { userId: string; role?: string },
    ) {
        return this.membersService.addMember(workspaceId, body.userId, requesterId, body.role);
    }

    @Get()
    findByWorkspace(
        @Param('workspaceId') workspaceId: string,
        @CurrentUser('userId') userId: string,
    ) {
        return this.membersService.findByWorkspace(workspaceId, userId);
    }

    @Patch(':userId')
    updateRole(
        @Param('workspaceId') workspaceId: string,
        @Param('userId') targetUserId: string,
        @CurrentUser('userId') requesterId: string,
        @Body() body: { role: string },
    ) {
        return this.membersService.updateRole(workspaceId, targetUserId, body.role, requesterId);
    }

    @Delete(':userId')
    removeMember(
        @Param('workspaceId') workspaceId: string,
        @Param('userId') targetUserId: string,
        @CurrentUser('userId') requesterId: string,
    ) {
        return this.membersService.removeMember(workspaceId, targetUserId, requesterId);
    }
}
