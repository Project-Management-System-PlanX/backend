import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) {}

    @Post()
    create(@CurrentUser('userId') userId: string, @Body() createProjectDto: CreateProjectDto) {
        return this.projectsService.create(createProjectDto, userId);
    }

    @Get()
    findAll(@CurrentUser('userId') userId: string) {
        return this.projectsService.findAll(userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.projectsService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @CurrentUser('userId') userId: string,
        @Body() updateProjectDto: UpdateProjectDto,
    ) {
        return this.projectsService.update(id, updateProjectDto, userId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
        return this.projectsService.remove(id, userId);
    }
}
