import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { CreateTaskAttachmentDto } from './dto/create-task-attachment.dto';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    @Post()
    create(@CurrentUser('userId') userId: string, @Body() createTaskDto: CreateTaskDto) {
        return this.tasksService.create(createTaskDto, userId);
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
    findAssignedToMe(@CurrentUser('userId') userId: string) {
        return this.tasksService.findAssignedToMe(userId);
    }

    @Get('worked-on')
    findWorkedOn(@CurrentUser('userId') userId: string) {
        return this.tasksService.findWorkedOn(userId);
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
    getComments(@Param('taskId') taskId: string, @CurrentUser('userId') userId: string) {
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

    // Attachments

    @Post(':taskId/attachments')
    addAttachment(
        @Param('taskId') taskId: string,
        @Body() createAttachmentDto: CreateTaskAttachmentDto,
        @CurrentUser('userId') userId: string,
    ) {
        return this.tasksService.createAttachment(taskId, createAttachmentDto, userId);
    }

    @Get(':taskId/attachments')
    getAttachments(@Param('taskId') taskId: string, @CurrentUser('userId') userId: string) {
        return this.tasksService.getAttachments(taskId, userId);
    }

    @Delete(':taskId/attachments/:attachmentId')
    removeAttachment(
        @Param('taskId') taskId: string,
        @Param('attachmentId') attachmentId: string,
        @CurrentUser('userId') userId: string,
    ) {
        return this.tasksService.deleteAttachment(taskId, attachmentId, userId);
    }
}
