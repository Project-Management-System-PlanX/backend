import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { BulkPositionDto, MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    @Post()
    create(@CurrentUser('userId') userId: string, @Body() dto: CreateTaskDto) {
        return this.tasksService.create(userId, dto);
    }

    @Get('space/:spaceId')
    findAllBySpace(@CurrentUser('userId') userId: string, @Param('spaceId') spaceId: string) {
        return this.tasksService.findAllBySpace(spaceId, userId);
    }

    @Get('assigned-to-me')
    findAssignedToMe(
        @CurrentUser('userId') userId: string,
        @Query('workspaceId') workspaceId: string,
    ) {
        return this.tasksService.findAssignedToMe(userId, workspaceId);
    }

    @Get('worked-on')
    findWorkedOn(@CurrentUser('userId') userId: string, @Query('workspaceId') workspaceId: string) {
        return this.tasksService.findWorkedOn(userId, workspaceId);
    }

    @Get(':id')
    findOne(@CurrentUser('userId') userId: string, @Param('id') id: string) {
        return this.tasksService.findOne(id, userId);
    }

    @Patch(':id')
    update(
        @CurrentUser('userId') userId: string,
        @Param('id') id: string,
        @Body() dto: UpdateTaskDto,
    ) {
        return this.tasksService.update(id, userId, dto);
    }

    @Delete(':id')
    remove(@CurrentUser('userId') userId: string, @Param('id') id: string) {
        return this.tasksService.remove(id, userId);
    }

    // ─── Drag-and-Drop ───

    @Patch(':id/move')
    moveTask(
        @CurrentUser('userId') userId: string,
        @Param('id') id: string,
        @Body() dto: MoveTaskDto,
    ) {
        return this.tasksService.moveTask(id, userId, dto);
    }

    @Post('bulk')
    bulkUpdate(@CurrentUser('userId') userId: string, @Body() dto: BulkPositionDto) {
        return this.tasksService.bulkUpdatePositions(userId, dto);
    }

    // ─── Comments ───

    @Post(':id/comments')
    addComment(
        @CurrentUser('userId') userId: string,
        @Param('id') id: string,
        @Body() dto: CreateCommentDto,
    ) {
        return this.tasksService.addComment(id, userId, dto);
    }

    @Get(':id/comments')
    getComments(@CurrentUser('userId') userId: string, @Param('id') id: string) {
        return this.tasksService.getComments(id, userId);
    }

    @Delete(':id/comments/:commentId')
    deleteComment(
        @CurrentUser('userId') userId: string,
        @Param('id') id: string,
        @Param('commentId') commentId: string,
    ) {
        return this.tasksService.deleteComment(id, commentId, userId);
    }

    // ─── Labels ───

    @Post(':id/labels')
    addLabel(
        @CurrentUser('userId') userId: string,
        @Param('id') id: string,
        @Body() body: { name: string; color: string },
    ) {
        return this.tasksService.addLabel(id, userId, body.name, body.color);
    }

    @Delete(':id/labels/:labelId')
    removeLabel(
        @CurrentUser('userId') userId: string,
        @Param('id') id: string,
        @Param('labelId') labelId: string,
    ) {
        return this.tasksService.removeLabel(id, labelId, userId);
    }

    // ─── Members ───

    @Post(':id/members')
    addMember(
        @CurrentUser('userId') userId: string,
        @Param('id') id: string,
        @Body('userId') memberUserId: string,
    ) {
        return this.tasksService.addMember(id, memberUserId, userId);
    }

    @Delete(':id/members/:memberUserId')
    removeMember(
        @CurrentUser('userId') userId: string,
        @Param('id') id: string,
        @Param('memberUserId') memberUserId: string,
    ) {
        return this.tasksService.removeMember(id, memberUserId, userId);
    }

    // ─── Activities ───

    @Get(':id/activities')
    getActivities(@CurrentUser('userId') userId: string, @Param('id') id: string) {
        return this.tasksService.getActivities(id, userId);
    }
}
