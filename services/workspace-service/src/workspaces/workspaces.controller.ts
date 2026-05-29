import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteByEmailDto } from './dto/invite-by-email.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
    constructor(private readonly workspacesService: WorkspacesService) { }

    @Post()
    create(@CurrentUser('userId') userId: string, @Body() createWorkspaceDto: CreateWorkspaceDto) {
        return this.workspacesService.create(createWorkspaceDto, userId);
    }

    @Get()
    findAll(@CurrentUser('userId') userId: string) {
        return this.workspacesService.findAll(userId);
    }

    @Get('all')
    findAllAdmin() {
        return this.workspacesService.findAllAdmin();
    }

    @Patch(':id/transfer')
    transferOwnership(@Param('id') id: string, @Body() body: { newOwnerId: string }) {
        return this.workspacesService.transferOwnership(id, body.newOwnerId);
    }

    // Invite routes MUST come before :id routes to avoid route conflicts
    @Public()
    @Get('invite/:token')
    getInvite(@Param('token') token: string) {
        return this.workspacesService.getInvite(token);
    }

    @Post('invite/:token/accept')
    acceptInvite(@Param('token') token: string, @CurrentUser('userId') userId: string) {
        return this.workspacesService.acceptInvite(token, userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.workspacesService.findOne(id);
    }

    @Get(':id/analytics')
    getAnalytics(@Param('id') id: string, @CurrentUser('userId') userId: string) {
        return this.workspacesService.getAnalytics(id, userId);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @CurrentUser('userId') userId: string,
        @Body() updateWorkspaceDto: UpdateWorkspaceDto,
    ) {
        return this.workspacesService.update(id, updateWorkspaceDto, userId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
        return this.workspacesService.remove(id, userId);
    }

    @Post(':id/invite')
    createInvite(
        @Param('id') id: string,
        @CurrentUser('userId') userId: string,
        @Body() body: { spaceId?: string },
    ) {
        return this.workspacesService.createInvite(id, userId, body.spaceId);
    }

    @Get(':id/invitations')
    getInvitations(@Param('id') id: string, @CurrentUser('userId') userId: string) {
        return this.workspacesService.getInvitations(id, userId);
    }

    @Post(':id/invite-email')
    inviteByEmail(
        @Param('id') id: string,
        @CurrentUser('userId') userId: string,
        @Body() dto: InviteByEmailDto,
    ) {
        return this.workspacesService.inviteByEmail(
            id,
            userId,
            dto.emails,
            dto.channelIds,
            dto.spaceId,
        );
    }
}
