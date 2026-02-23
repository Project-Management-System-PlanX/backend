import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
    constructor(private readonly workspacesService: WorkspacesService) {}

    @Post()
    create(@CurrentUser('userId') userId: string, @Body() createWorkspaceDto: CreateWorkspaceDto) {
        return this.workspacesService.create(createWorkspaceDto, userId);
    }

    @Get()
    findAll(@CurrentUser('userId') userId: string) {
        return this.workspacesService.findAll(userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.workspacesService.findOne(id);
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
}
