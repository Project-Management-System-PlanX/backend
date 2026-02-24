import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { ProjectMembersService } from './project-members.service';

@Controller('projects/:projectId/members')
export class ProjectMembersController {
    constructor(private readonly projectMembersService: ProjectMembersService) { }

    @Post()
    addMember(
        @Param('projectId') projectId: string,
        @Body() body: { userId: string; role?: string },
    ) {
        return this.projectMembersService.addMember(projectId, body.userId, body.role);
    }

    @Get()
    findByProject(@Param('projectId') projectId: string) {
        return this.projectMembersService.findByProject(projectId);
    }

    @Patch(':userId')
    updateRole(
        @Param('projectId') projectId: string,
        @Param('userId') targetUserId: string,
        @CurrentUser('userId') requesterId: string,
        @Body() body: { role: string },
    ) {
        return this.projectMembersService.updateRole(projectId, targetUserId, body.role, requesterId);
    }

    @Delete(':userId')
    removeMember(
        @Param('projectId') projectId: string,
        @Param('userId') targetUserId: string,
        @CurrentUser('userId') requesterId: string,
    ) {
        return this.projectMembersService.removeMember(projectId, targetUserId, requesterId);
    }
}
