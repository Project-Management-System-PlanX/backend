import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { TeamsService } from './teams.service';

@Controller('teams')
export class TeamsController {
    constructor(private readonly teamsService: TeamsService) {}

    @Post()
    create(@Body() body: { workspaceId: string; name: string; description: string }) {
        return this.teamsService.create(body.workspaceId, body.name, body.description);
    }

    @Get('workspace/:workspaceId')
    findByWorkspace(@Param('workspaceId') workspaceId: string) {
        return this.teamsService.findByWorkspace(workspaceId);
    }

    @Post(':id/members')
    addMember(@Param('id') id: string, @Body() body: { userId: string; role: string }) {
        return this.teamsService.addMember(id, body.userId, body.role);
    }

    @Delete(':id/members/:userId')
    removeMember(@Param('id') id: string, @Param('userId') userId: string) {
        return this.teamsService.removeMember(id, userId);
    }
}
