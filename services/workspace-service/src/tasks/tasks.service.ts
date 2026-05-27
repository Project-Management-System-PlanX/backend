// src/tasks/tasks.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { BulkPositionDto, MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const TASK_INCLUDE = {
    status: true,
    labels: true,
    comments: { orderBy: { createdAt: 'desc' as const }, take: 5 },
    attachments: true,
    parent: { select: { id: true, title: true, taskNumber: true } },
    children: { select: { id: true, title: true, taskNumber: true, statusId: true } },
    assignees: { include: { user: true } },
    team: { select: { id: true, name: true } },
    checklists: {
        include: { items: { orderBy: { position: 'asc' as const } } },
        orderBy: { position: 'asc' as const },
    },
};

@Injectable()
export class TasksService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notifications: NotificationsService,
    ) {}

    // ─── Access Check ───

    private async checkSpaceAccess(spaceId: string, userId: string) {
        const space = await this.prisma.space.findUnique({
            where: { id: spaceId },
            include: {
                workspace: { include: { members: { where: { userId } } } },
            },
        });
        if (!space) throw new NotFoundException('Space not found');
        if (space.workspace.members.length === 0)
            throw new ForbiddenException('No access to this space');
        return space;
    }

    private async getTaskWithAccess(taskId: string, userId: string) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: {
                space: {
                    include: {
                        workspace: { include: { members: { where: { userId } } } },
                    },
                },
            },
        });
        if (!task) throw new NotFoundException('Task not found');
        if (task.space.workspace.members.length === 0)
            throw new ForbiddenException('No access to this task');
        return task;
    }

    // ─── CRUD ───

    async create(userId: string, dto: CreateTaskDto) {
        await this.checkSpaceAccess(dto.spaceId, userId);

        const task = await this.prisma.$transaction(async (tx) => {
            const space = await tx.space.findUnique({
                where: { id: dto.spaceId },
                select: { taskCounter: true },
            });
            const nextNumber = (space?.taskCounter ?? 0) + 1;

            let position = dto.position;
            if (position === undefined) {
                const lastTask = await tx.task.findFirst({
                    where: { spaceId: dto.spaceId, statusId: dto.statusId },
                    orderBy: { position: 'desc' },
                });
                position = lastTask ? lastTask.position + 65536 : 65536;
            }

            const newTask = await tx.task.create({
                data: {
                    spaceId: dto.spaceId,
                    statusId: dto.statusId,
                    title: dto.title,
                    description: dto.description,
                    priority: dto.priority || 'NONE',
                    workType: dto.workType || 'TASK',
                    assigneeId: dto.assigneeId,
                    reporterId: userId,
                    dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
                    startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                    position,
                    parentId: dto.parentId,
                    teamId: dto.teamId,
                    flagged: dto.flagged || false,
                    taskNumber: nextNumber,
                },
                include: TASK_INCLUDE,
            });

            await tx.space.update({
                where: { id: dto.spaceId },
                data: { taskCounter: nextNumber },
            });

            return newTask;
        });

        await this.logActivity(task.id, userId, 'CREATED', null, null, task.title);

        // Notify assignee on task create
        if (task.assigneeId && task.assigneeId !== userId) {
            await this.notifications.create({
                userId: task.assigneeId,
                type: 'TASK_ASSIGNED',
                title: 'You were assigned a task',
                body: task.title,
                entityId: task.id,
                entityType: 'task',
            });
        }

        return task;
    }

    async bulkCreate(userId: string, dto: { tasks: CreateTaskDto[] }) {
        const createdTasks = [];
        for (const taskDto of dto.tasks) {
            createdTasks.push(await this.create(userId, taskDto));
        }
        return createdTasks;
    }

    async findAllBySpace(spaceId: string, userId: string) {
        await this.checkSpaceAccess(spaceId, userId);
        return this.prisma.task.findMany({
            where: { spaceId },
            include: TASK_INCLUDE,
            orderBy: { position: 'asc' },
        });
    }

    async findOne(id: string, userId: string) {
        await this.getTaskWithAccess(id, userId);
        return this.prisma.task.findUnique({
            where: { id },
            include: {
                ...TASK_INCLUDE,
                comments: { orderBy: { createdAt: 'desc' as const } },
            },
        });
    }

    async update(id: string, userId: string, dto: UpdateTaskDto) {
        const existing = await this.getTaskWithAccess(id, userId);

        const changes: Array<{ field: string; oldValue: string; newValue: string }> = [];
        for (const [key, value] of Object.entries(dto)) {
            if (value !== undefined && (existing as any)[key] !== value) {
                changes.push({
                    field: key,
                    oldValue: String((existing as any)[key] ?? ''),
                    newValue: String(value),
                });
            }
        }

        const data: any = { ...dto };
        if (dto.dueDate) data.dueDate = new Date(dto.dueDate);
        if (dto.startDate) data.startDate = new Date(dto.startDate);
        if (dto.dueDate === null) data.dueDate = null;
        if (dto.startDate === null) data.startDate = null;

        const task = await this.prisma.task.update({
            where: { id },
            data,
            include: TASK_INCLUDE,
        });

        for (const change of changes) {
            await this.logActivity(
                id,
                userId,
                'UPDATED',
                change.field,
                change.oldValue,
                change.newValue,
            );
        }

        // Notify on assignee change
        const assigneeChanged =
            dto.assigneeId !== undefined && dto.assigneeId !== existing.assigneeId;
        if (assigneeChanged && dto.assigneeId && dto.assigneeId !== userId) {
            await this.notifications.create({
                userId: dto.assigneeId,
                type: 'TASK_ASSIGNED',
                title: 'You were assigned a task',
                body: task.title,
                entityId: task.id,
                entityType: 'task',
            });
        }

        return task;
    }

    async remove(id: string, userId: string) {
        await this.getTaskWithAccess(id, userId);
        await this.prisma.task.delete({ where: { id } });
        return { deleted: true };
    }

    // ─── Drag-and-Drop ───

    async moveTask(id: string, userId: string, dto: MoveTaskDto) {
        const existing = await this.getTaskWithAccess(id, userId);
        const oldStatusId = existing.statusId;

        const task = await this.prisma.task.update({
            where: { id },
            data: {
                statusId: dto.statusId,
                position: dto.position,
                parentId: dto.parentId !== undefined ? dto.parentId : undefined,
            },
            include: TASK_INCLUDE,
        });

        if (oldStatusId !== dto.statusId) {
            await this.logActivity(id, userId, 'MOVED', 'statusId', oldStatusId, dto.statusId);
        }

        return task;
    }

    async bulkUpdatePositions(userId: string, dto: BulkPositionDto) {
        if (dto.updates.length > 0) {
            await this.getTaskWithAccess(dto.updates[0].id, userId);
        }
        const ops = dto.updates.map((u) =>
            this.prisma.task.update({
                where: { id: u.id },
                data: { statusId: u.statusId, position: u.position },
            }),
        );
        await this.prisma.$transaction(ops);
        return { updated: dto.updates.length };
    }

    // ─── Assigned / Worked-on ───

    async findAssignedToMe(userId: string, workspaceId: string) {
        if (!workspaceId) return [];
        return this.prisma.task.findMany({
            where: { assigneeId: userId, space: { workspaceId } },
            include: TASK_INCLUDE,
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findWorkedOn(userId: string, workspaceId: string) {
        if (!workspaceId) return [];
        return this.prisma.task.findMany({
            where: {
                space: { workspaceId },
                OR: [{ assigneeId: userId }, { reporterId: userId }],
            },
            include: TASK_INCLUDE,
            orderBy: { updatedAt: 'desc' },
            take: 50,
        });
    }

    // ─── Comments ───

    async addComment(taskId: string, userId: string, dto: CreateCommentDto) {
        await this.getTaskWithAccess(taskId, userId);
        const comment = await this.prisma.taskComment.create({
            data: { taskId, userId, content: dto.content },
        });
        await this.logActivity(
            taskId,
            userId,
            'COMMENTED',
            null,
            null,
            dto.content.substring(0, 100),
        );
        return comment;
    }

    async getComments(taskId: string, userId: string) {
        await this.getTaskWithAccess(taskId, userId);
        return this.prisma.taskComment.findMany({
            where: { taskId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async deleteComment(taskId: string, commentId: string, userId: string) {
        await this.getTaskWithAccess(taskId, userId);
        const comment = await this.prisma.taskComment.findUnique({ where: { id: commentId } });
        if (!comment || comment.taskId !== taskId) throw new NotFoundException('Comment not found');
        await this.prisma.taskComment.delete({ where: { id: commentId } });
        return { deleted: true };
    }

    // ─── Labels ───

    async addLabel(taskId: string, userId: string, name: string, color: string) {
        await this.getTaskWithAccess(taskId, userId);
        return this.prisma.taskLabel.create({ data: { taskId, name, color } });
    }

    async removeLabel(taskId: string, labelId: string, userId: string) {
        await this.getTaskWithAccess(taskId, userId);
        try {
            await this.prisma.taskLabel.delete({ where: { id: labelId } });
        } catch {}
        return { deleted: true };
    }

    // ─── Members ───

    async addMember(taskId: string, memberUserId: string, userId: string) {
        await this.getTaskWithAccess(taskId, userId);

        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            select: { title: true },
        });

        try {
            const member = await this.prisma.taskMember.create({
                data: { taskId, userId: memberUserId },
                include: { user: true },
            });

            // Notify added member (skip if adding yourself)
            if (memberUserId !== userId) {
                await this.notifications.create({
                    userId: memberUserId,
                    type: 'TASK_ASSIGNED',
                    title: 'You were added to a task',
                    body: task?.title,
                    entityId: taskId,
                    entityType: 'task',
                });
            }

            return member;
        } catch {
            return this.prisma.taskMember.findUnique({
                where: { taskId_userId: { taskId, userId: memberUserId } },
                include: { user: true },
            });
        }
    }

    async removeMember(taskId: string, memberUserId: string, userId: string) {
        await this.getTaskWithAccess(taskId, userId);
        try {
            await this.prisma.taskMember.delete({
                where: { taskId_userId: { taskId, userId: memberUserId } },
            });
        } catch {}
        return { deleted: true };
    }

    // ─── Activity Log ───

    async getActivities(taskId: string, userId: string) {
        await this.getTaskWithAccess(taskId, userId);
        return this.prisma.activityLog.findMany({
            where: { taskId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    private async logActivity(
        taskId: string,
        userId: string,
        action: string,
        field: string | null,
        oldValue: string | null,
        newValue: string | null,
    ) {
        try {
            await this.prisma.activityLog.create({
                data: { taskId, userId, action, field, oldValue, newValue },
            });
        } catch {}
    }
}
