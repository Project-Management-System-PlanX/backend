import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';

@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Post()
    create(@CurrentUser('userId') userId: string, @Body() createTaskDto: CreateTaskDto) {
        return this.tasksService.create(createTaskDto, userId);
    }

    @Post('bulk')
    createBulk(@CurrentUser('userId') userId: string, @Body('tasks') tasks: CreateTaskDto[]) {
        return this.tasksService.createBulk(tasks, userId);
    }

    @Get('space/:spaceId')
    findBySpace(
        @Param('spaceId') spaceId: string,
        @Query('status') status: string,
        @Query('assignee') assignee: string,
        @Query('priority') priority: string,
        @CurrentUser('userId') userId: string,
    ) {
        return this.tasksService.findBySpace(spaceId, userId, { status, assignee, priority });
    }

    @Get('assigned-to-me')
    findAssignedToMe(
        @Query('workspaceId') workspaceId: string,
        @CurrentUser('userId') userId: string,
    ) {
        return this.tasksService.findAssignedToMe(userId, workspaceId);
    }

    @Get('worked-on')
    findWorkedOn(
        @Query('workspaceId') workspaceId: string,
        @CurrentUser('userId') userId: string,
    ) {
        return this.tasksService.findWorkedOn(userId, workspaceId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser('userId') userId: string) {
        return this.tasksService.findOne(id, userId);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateTaskDto: UpdateTaskDto,
        @CurrentUser('userId') userId: string,
    ) {
        return this.tasksService.update(id, updateTaskDto, userId);
    }

    @Patch(':id/move')
    moveTask(
        @Param('id') id: string,
        @Body() moveTaskDto: MoveTaskDto,
        @CurrentUser('userId') userId: string,
    ) {
        return this.tasksService.moveTask(id, moveTaskDto, userId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
        return this.tasksService.delete(id, userId);
    }

    // AI Features

    @Post(':id/assign-ai')
    assignViaAi(
        @Param('id') id: string,
        @Body('workspaceId') workspaceId: string,
        @CurrentUser('userId') userId: string,
    ) {
        return this.tasksService.assignViaAi(id, workspaceId, userId);
    }

    // Comments

    @Post(':taskId/comments')
    addComment(
        @Param('taskId') taskId: string,
        @Body() createCommentDto: CreateTaskCommentDto,
        @CurrentUser('userId') userId: string,
    ) {
        return this.tasksService.createComment(taskId, createCommentDto, userId);
    }

    @Get(':taskId/comments')
    getComments(
        @Param('taskId') taskId: string,
        @CurrentUser('userId') userId: string,
    ) {
        return this.tasksService.getComments(taskId, userId);
    }

    @Delete(':taskId/comments/:commentId')
    removeComment(
        @Param('taskId') taskId: string,
        @Param('commentId') commentId: string,
        @CurrentUser('userId') userId: string,
    ) {
        return this.tasksService.deleteComment(taskId, commentId, userId);
    }
}
