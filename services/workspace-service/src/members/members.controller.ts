import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { MembersService } from './members.service';

@Controller('workspaces/:workspaceId/members')
export class MembersController {
    constructor(private readonly membersService: MembersService) {}

    @Post()
    addMember(
        @Param('workspaceId') workspaceId: string,
        @Body() body: { userId: string; role?: string },
    ) {
        return this.membersService.addMember(workspaceId, body.userId, body.role);
    }

    @Get()
    findByWorkspace(@Param('workspaceId') workspaceId: string) {
        return this.membersService.findByWorkspace(workspaceId);
    }

    @Patch(':userId')
    updateRole(
        @Param('workspaceId') workspaceId: string,
        @Param('userId') userId: string,
        @Body() body: { role: string },
    ) {
        return this.membersService.updateRole(workspaceId, userId, body.role);
    }

    @Delete(':userId')
    removeMember(@Param('workspaceId') workspaceId: string, @Param('userId') userId: string) {
        return this.membersService.removeMember(workspaceId, userId);
    }
}
