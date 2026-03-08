import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { CreateTaskAttachmentDto } from './dto/create-task-attachment.dto';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);
    constructor(private readonly prisma: PrismaService) {}

    // =========================
    // Tasks CRUD
    // =========================

    async create(createTaskDto: CreateTaskDto, userId: string) {
        this.logger.log(`Creating task: userId=${userId}, dto=${JSON.stringify(createTaskDto)}`);
        try {
            const {
                spaceId,
                title,
                description,
                priority,
                assigneeId,
                dueDate,
                startDate,
                statusId: providedStatusId,
                workType,
                parentId,
                teamId,
                flagged,
                restrictTo,
                labels,
            } = createTaskDto;

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

            // 4. Create task with all fields
            return await this.prisma.task.create({
                data: {
                    spaceId,
                    title,
                    description,
                    priority: priority || 'NONE',
                    workType: workType || 'TASK',
                    assigneeId,
                    reporterId: userId,
                    dueDate: dueDate ? new Date(dueDate) : null,
                    startDate: startDate ? new Date(startDate) : null,
                    statusId,
                    taskNumber: updatedSpace.taskCounter,
                    position: createTaskDto.position || 0,
                    parentId: parentId || null,
                    teamId: teamId || null,
                    flagged: flagged || false,
                    restrictTo: restrictTo || null,
                    ...(labels && labels.length > 0
                        ? {
                              labels: {
                                  create: labels.map((label) => ({
                                      name: label,
                                      color: '#94A3B8',
                                  })),
                              },
                          }
                        : {}),
                },
                include: {
                    status: true,
                    labels: true,
                    attachments: true,
                    parent: { select: { id: true, title: true, taskNumber: true } },
                    team: { select: { id: true, name: true } },
                },
            });
        } catch (error) {
            this.logger.error('Failed to create task', error?.stack || error);
            this.logger.error('Create task payload', JSON.stringify(createTaskDto));
            // Re-throw NestJS HTTP exceptions as-is
            if (error?.status) throw error;
            throw new InternalServerErrorException(
                `Failed to create task: ${error?.message || 'Unknown error'}`,
            );
        }
    }

    async findBySpace(
        spaceId: string,
        userId: string,
        query: { status?: string; assignee?: string; priority?: string },
    ) {
        await this.checkSpaceAccess(spaceId, userId);

        // biome-ignore lint/suspicious/noExplicitAny: Generic where clause for Prisma
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
                attachments: true,
                parent: { select: { id: true, title: true, taskNumber: true } },
                team: { select: { id: true, name: true } },
                _count: { select: { comments: true } },
            },
            orderBy: [{ status: { position: 'asc' } }, { position: 'asc' }],
        });
    }

    async findAssignedToMe(userId: string) {
        // Finds tasks across all spaces where user is the assignee and is a member of the workspace
        return this.prisma.task.findMany({
            where: {
                assigneeId: userId,
                space: {
                    workspace: {
                        members: { some: { userId } },
                    },
                },
            },
            include: {
                space: { select: { name: true, prefix: true, color: true, icon: true } },
                status: true,
                labels: true,
                attachments: true,
                team: { select: { id: true, name: true } },
            },
            orderBy: { dueDate: 'asc' },
        });
    }

    async findWorkedOn(userId: string) {
        // Finds tasks the user created/reported, but which are not currently assigned to them
        return this.prisma.task.findMany({
            where: {
                reporterId: userId,
                assigneeId: { not: userId },
                space: {
                    workspace: {
                        members: { some: { userId } },
                    },
                },
            },
            include: {
                space: { select: { name: true, prefix: true, color: true, icon: true } },
                status: true,
                labels: true,
                attachments: true,
                team: { select: { id: true, name: true } },
            },
            orderBy: { updatedAt: 'desc' },
            take: 100,
        });
    }

    async findOne(id: string, userId: string) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: {
                space: true,
                status: true,
                labels: true,
                attachments: true,
                parent: { select: { id: true, title: true, taskNumber: true } },
                team: { select: { id: true, name: true } },
                children: { select: { id: true, title: true, taskNumber: true, statusId: true } },
                linkedFrom: {
                    include: { toTask: { select: { id: true, title: true, taskNumber: true } } },
                },
                linkedTo: {
                    include: { fromTask: { select: { id: true, title: true, taskNumber: true } } },
                },
                comments: {
                    orderBy: { createdAt: 'asc' },
                },
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

        const { labels, dueDate, startDate, ...updateData } = updateTaskDto;

        // Process labels if provided
        let labelsOps = {};
        if (labels) {
            // Very simple: delete old, create new
            labelsOps = {
                labels: {
                    deleteMany: {},
                    create: labels.map((label) => ({ name: label, color: '#94A3B8' })),
                },
            };
        }

        // biome-ignore lint/suspicious/noExplicitAny: Generic data object for Prisma update
        const data: any = {
            ...updateData,
            ...labelsOps,
        };

        if (dueDate !== undefined) {
            data.dueDate = dueDate ? new Date(dueDate) : null;
        }
        if (startDate !== undefined) {
            data.startDate = startDate ? new Date(startDate) : null;
        }

        return this.prisma.task.update({
            where: { id },
            data,
            include: {
                status: true,
                labels: true,
                attachments: true,
                parent: { select: { id: true, title: true, taskNumber: true } },
                team: { select: { id: true, name: true } },
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
            include: {
                space: { include: { workspace: { include: { members: { where: { userId } } } } } },
            },
        });

        if (!task || task.space.workspace.members.length === 0) {
            throw new NotFoundException('Task not found');
        }

        const role = task.space.workspace.members[0].role;
        if (task.reporterId !== userId && role !== 'ADMIN' && role !== 'OWNER') {
            throw new ForbiddenException(
                'Only the reporter or a workspace admin can delete a task',
            );
        }

        return this.prisma.task.delete({ where: { id } });
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
            include: {
                space: { include: { workspace: { include: { members: { where: { userId } } } } } },
            },
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

    // =========================
    // Attachments
    // =========================

    async createAttachment(taskId: string, dto: CreateTaskAttachmentDto, userId: string) {
        const task = await this.prisma.task.findUnique({ where: { id: taskId } });
        if (!task) throw new NotFoundException('Task not found');
        await this.checkSpaceAccess(task.spaceId, userId);

        return this.prisma.taskAttachment.create({
            data: {
                taskId,
                fileName: dto.fileName,
                fileUrl: dto.fileUrl,
                fileType: dto.fileType,
                fileSize: dto.fileSize,
            },
        });
    }

    async getAttachments(taskId: string, userId: string) {
        const task = await this.prisma.task.findUnique({ where: { id: taskId } });
        if (!task) throw new NotFoundException('Task not found');
        await this.checkSpaceAccess(task.spaceId, userId);

        return this.prisma.taskAttachment.findMany({
            where: { taskId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async deleteAttachment(taskId: string, attachmentId: string, userId: string) {
        const attachment = await this.prisma.taskAttachment.findUnique({
            where: { id: attachmentId },
        });
        if (!attachment || attachment.taskId !== taskId) {
            throw new NotFoundException('Attachment not found');
        }

        const task = await this.prisma.task.findUnique({ where: { id: taskId } });
        if (!task) throw new NotFoundException('Task not found');
        await this.checkSpaceAccess(task.spaceId, userId);

        return this.prisma.taskAttachment.delete({ where: { id: attachmentId } });
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
