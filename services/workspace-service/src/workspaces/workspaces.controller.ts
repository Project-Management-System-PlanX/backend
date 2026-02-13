import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import type { CreateWorkspaceDto } from './dto/create-workspace.dto';
import type { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import type { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
    constructor(private readonly workspacesService: WorkspacesService) {}

    @Post()
    create(@Body() createWorkspaceDto: CreateWorkspaceDto) {
        return this.workspacesService.create(createWorkspaceDto);
    }

    @Get()
    findAll(@Query('userId') userId?: string) {
        return this.workspacesService.findAll(userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.workspacesService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateWorkspaceDto: UpdateWorkspaceDto) {
        return this.workspacesService.update(id, updateWorkspaceDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.workspacesService.remove(id);
    }
}
