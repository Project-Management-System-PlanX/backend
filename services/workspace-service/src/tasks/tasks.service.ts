import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';

@Injectable()
export class TasksService {
    constructor(private readonly prisma: PrismaService) { }

    // =========================
    // Tasks CRUD
    // =========================

    async create(createTaskDto: CreateTaskDto, userId: string) {
        const { spaceId, title, description, priority, assigneeId, dueDate, statusId: providedStatusId } = createTaskDto;

        // 1. Verify user is in workspace
        const space = await this.prisma.space.findUnique({
            where: { id: spaceId },
            include: {
                workspace: { include: { members: { where: { userId } } } },
                statuses: { orderBy: { position: 'asc' } },
            },
        });

        if (!space || space.workspace.members.length === 0) {
            throw new ForbiddenException('You do not have access to this space');
        }

        if (space.statuses.length === 0) {
            throw new BadRequestException('Space has no statuses configured');
        }

        // 2. Increment task counter
        const updatedSpace = await this.prisma.space.update({
            where: { id: spaceId },
            data: { taskCounter: { increment: 1 } },
        });

        // 3. Determine status (use provided or first status)
        const statusId = providedStatusId || space.statuses[0].id;

        // 4. Create task
        return this.prisma.task.create({
            data: {
                spaceId,
                title,
                description,
                priority: priority || 'NONE',
                assigneeId,
                reporterId: userId,
                dueDate: dueDate ? new Date(dueDate) : null,
                statusId,
                taskNumber: updatedSpace.taskCounter,
                position: createTaskDto.position || 0,
            },
            include: {
                status: true,
                labels: true,
            },
        });
    }

    async createBulk(tasks: CreateTaskDto[], userId: string) {
        const createdTasks = [];
        for (const dto of tasks) {
            try {
                const created = await this.create(dto, userId);
                createdTasks.push(created);
            } catch (err) {
                console.error('Failed to create task in bulk:', err);
            }
        }
        return createdTasks;
    }

    async findBySpace(spaceId: string, userId: string, query: { status?: string; assignee?: string; priority?: string }) {
        await this.checkSpaceAccess(spaceId, userId);

        const where: any = { spaceId };
        if (query.status) where.statusId = query.status;
        if (query.assignee) {
            where.assigneeId = query.assignee === 'me' ? userId : query.assignee;
        }
        if (query.priority) where.priority = query.priority.toUpperCase();

        return this.prisma.task.findMany({
            where,
            include: {
                status: true,
                labels: true,
                _count: { select: { comments: true } }
            },
            orderBy: [
                { status: { position: 'asc' } },
                { position: 'asc' },
            ],
        });
    }

    async findAssignedToMe(userId: string, workspaceId?: string) {
        // Finds tasks across all spaces where user is the assignee and is a member of the workspace
        return this.prisma.task.findMany({
            where: {
                assigneeId: userId,
                space: {
                    workspaceId: workspaceId ? workspaceId : undefined,
                    workspace: {
                        members: { some: { userId } }
                    }
                }
            },
            include: {
                space: { select: { name: true, prefix: true, color: true, icon: true } },
                status: true,
                labels: true,
            },
            orderBy: { dueDate: 'asc' },
        });
    }

    async findWorkedOn(userId: string, workspaceId?: string) {
        return this.prisma.task.findMany({
            where: {
                OR: [
                    { assigneeId: userId },
                    { reporterId: userId },
                ],
                space: {
                    workspaceId: workspaceId ? workspaceId : undefined,
                    workspace: {
                        members: { some: { userId } }
                    }
                }
            },
            include: {
                space: { select: { name: true, prefix: true, color: true, icon: true } },
                status: true,
                labels: true,
            },
            orderBy: { updatedAt: 'desc' },
            take: 20,
        });
    }

    async findOne(id: string, userId: string) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: {
                space: true,
                status: true,
                labels: true,
                comments: {
                    orderBy: { createdAt: 'asc' }
                }
            },
        });

        if (!task) throw new NotFoundException('Task not found');
        await this.checkSpaceAccess(task.spaceId, userId);

        return task;
    }

    async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
        const task = await this.prisma.task.findUnique({ where: { id } });
        if (!task) throw new NotFoundException('Task not found');
        await this.checkSpaceAccess(task.spaceId, userId);

        const { labels, dueDate, ...updateData } = updateTaskDto;

        // Process labels if provided
        let labelsOps = {};
        if (labels) {
            // Very simple: delete old, create new
            labelsOps = {
                labels: {
                    deleteMany: {},
                    create: labels.map(label => ({ name: label, color: '#94A3B8' })),
                }
            };
        }

        const data: any = {
            ...updateData,
            ...labelsOps
        };

        if (dueDate !== undefined) {
            data.dueDate = dueDate ? new Date(dueDate) : null;
        }

        return this.prisma.task.update({
            where: { id },
            data,
            include: {
                status: true,
                labels: true,
            },
        });
    }

    async moveTask(id: string, moveTaskDto: MoveTaskDto, userId: string) {
        const task = await this.prisma.task.findUnique({ where: { id } });
        if (!task) throw new NotFoundException('Task not found');
        await this.checkSpaceAccess(task.spaceId, userId);

        const { statusId, position } = moveTaskDto;

        const targetStatus = await this.prisma.taskStatus.findUnique({
            where: { id: statusId },
        });

        if (!targetStatus || targetStatus.spaceId !== task.spaceId) {
            throw new BadRequestException('Invalid target status');
        }

        let resolution = task.resolution;
        if (targetStatus.isDone && task.resolution === 'UNRESOLVED') {
            resolution = 'DONE';
        } else if (!targetStatus.isDone && task.resolution === 'DONE') {
            resolution = 'UNRESOLVED';
        }

        return this.prisma.task.update({
            where: { id },
            data: {
                statusId,
                position,
                resolution,
            },
            include: { status: true, labels: true },
        });
    }

    async delete(id: string, userId: string) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: { space: { include: { workspace: { include: { members: { where: { userId } } } } } } }
        });

        if (!task || task.space.workspace.members.length === 0) {
            throw new NotFoundException('Task not found');
        }

        const role = task.space.workspace.members[0].role;
        if (task.reporterId !== userId && role !== 'ADMIN' && role !== 'OWNER') {
            throw new ForbiddenException('Only the reporter or a workspace admin can delete a task');
        }

        return this.prisma.task.delete({ where: { id } });
    }

    // =========================
    // AI Feature
    // =========================

    async assignViaAi(taskId: string, workspaceId: string, userId: string) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: { space: { include: { workspace: { include: { members: true } } } } },
        });

        if (!task || task.space.workspace.id !== workspaceId) {
            throw new NotFoundException('Task not found in this workspace');
        }

        const members = task.space.workspace.members;
        if (!members || members.length === 0) {
            throw new BadRequestException('Workspace has no members to assign');
        }

        // Mock AI logic: deterministic member picking
        const combinedText = (task.title + (task.description || '')).length;
        const memberIndex = combinedText % members.length;
        const selectedMember = members[memberIndex];

        return this.prisma.task.update({
            where: { id: taskId },
            data: { assigneeId: selectedMember.userId },
        });
    }

    // =========================
    // Comments
    // =========================

    async createComment(taskId: string, createCommentDto: CreateTaskCommentDto, userId: string) {
        const task = await this.prisma.task.findUnique({ where: { id: taskId } });
        if (!task) throw new NotFoundException('Task not found');
        await this.checkSpaceAccess(task.spaceId, userId);

        return this.prisma.taskComment.create({
            data: {
                taskId,
                userId,
                content: createCommentDto.content,
            },
        });
    }

    async getComments(taskId: string, userId: string) {
        const task = await this.prisma.task.findUnique({ where: { id: taskId } });
        if (!task) throw new NotFoundException('Task not found');
        await this.checkSpaceAccess(task.spaceId, userId);

        return this.prisma.taskComment.findMany({
            where: { taskId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async deleteComment(taskId: string, commentId: string, userId: string) {
        const comment = await this.prisma.taskComment.findUnique({ where: { id: commentId } });
        if (!comment || comment.taskId !== taskId) {
            throw new NotFoundException('Comment not found');
        }

        // Only author or space access can delete (simplified)
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: { space: { include: { workspace: { include: { members: { where: { userId } } } } } } }
        });

        if (!task || task.space.workspace.members.length === 0) {
            throw new NotFoundException('Task not found');
        }

        const role = task.space.workspace.members[0].role;
        if (comment.userId !== userId && role !== 'ADMIN' && role !== 'OWNER') {
            throw new ForbiddenException('Not authorized to delete this comment');
        }

        return this.prisma.taskComment.delete({ where: { id: commentId } });
    }

    // Helper
    private async checkSpaceAccess(spaceId: string, userId: string) {
        const space = await this.prisma.space.findUnique({
            where: { id: spaceId },
            include: { workspace: { include: { members: { where: { userId } } } } },
        });

        if (!space || space.workspace.members.length === 0) {
            throw new ForbiddenException('You do not have access to this space');
        }

        return space;
    }
}
