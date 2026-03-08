import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateSpaceDto } from './dto/create-space.dto';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { SpacesService } from './spaces.service';

@Controller('spaces')
export class SpacesController {
    constructor(private readonly spacesService: SpacesService) {}

    @Post()
    create(@CurrentUser('userId') userId: string, @Body() createSpaceDto: CreateSpaceDto) {
        return this.spacesService.create(userId, createSpaceDto);
    }

    @Get('workspace/:workspaceId')
    findAllByWorkspace(
        @Param('workspaceId') workspaceId: string,
        @CurrentUser('userId') userId: string,
    ) {
        return this.spacesService.findAllByWorkspace(workspaceId, userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser('userId') userId: string) {
        return this.spacesService.findOne(id, userId);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateSpaceDto: UpdateSpaceDto,
        @CurrentUser('userId') userId: string,
    ) {
        return this.spacesService.update(id, updateSpaceDto, userId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
        return this.spacesService.remove(id, userId);
    }

    // --- Task Status Endpoints ---

    @Post(':spaceId/statuses')
    createStatus(
        @Param('spaceId') spaceId: string,
        @Body() createStatusDto: CreateStatusDto,
        @CurrentUser('userId') userId: string,
    ) {
        return this.spacesService.createStatus(spaceId, createStatusDto, userId);
    }

    @Patch(':spaceId/statuses/:statusId')
    updateStatus(
        @Param('spaceId') spaceId: string,
        @Param('statusId') statusId: string,
        @Body() updateStatusDto: UpdateStatusDto,
        @CurrentUser('userId') userId: string,
    ) {
        return this.spacesService.updateStatus(spaceId, statusId, updateStatusDto, userId);
    }

    @Delete(':spaceId/statuses/:statusId')
    removeStatus(
        @Param('spaceId') spaceId: string,
        @Param('statusId') statusId: string,
        @CurrentUser('userId') userId: string,
    ) {
        return this.spacesService.deleteStatus(spaceId, statusId, userId);
    }
}
