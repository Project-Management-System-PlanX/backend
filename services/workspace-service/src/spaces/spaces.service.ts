import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class SpacesService {
    constructor(private readonly prisma: PrismaService) { }

    generatePrefix(name: string): string {
        return name
            .split(/[\s-]+/)
            .map((word) => word.charAt(0))
            .join('')
            .substring(0, 4)
            .toUpperCase() || 'SPC';
    }

    async create(userId: string, createSpaceDto: CreateSpaceDto) {
        const { workspaceId, name } = createSpaceDto;

        // Check workspace membership
        const member = await this.prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: { workspaceId, userId: userId },
            },
            include: { workspace: true },
        });

        if (!member) {
            throw new ForbiddenException('You must be a member of the workspace to create a space');
        }

        // Determine prefix
        let prefix = createSpaceDto.prefix || this.generatePrefix(name);
        let collision = await this.prisma.space.findUnique({
            where: { workspaceId_prefix: { workspaceId, prefix } },
        });

        let counter = 1;
        let basePrefix = prefix;
        while (collision) {
            prefix = `${basePrefix}${counter}`;
            collision = await this.prisma.space.findUnique({
                where: { workspaceId_prefix: { workspaceId, prefix } },
            });
            counter++;
        }

        // Create space and default statuses
        return this.prisma.space.create({
            data: {
                ...createSpaceDto,
                prefix,
                createdBy: userId,
                statuses: {
                    create: [
                        { name: 'Today', color: '#A16207', position: 0, isDone: false },
                        { name: 'This Week', color: '#166534', position: 1, isDone: false },
                        { name: 'Later', color: '#111111', position: 2, isDone: false },
                    ],
                },
            },
            include: {
                statuses: { orderBy: { position: 'asc' } },
            },
        });
    }

    async findAllByWorkspace(workspaceId: string, userId: string) {
        const member = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId: userId } },
        });

        if (!member) {
            throw new ForbiddenException('Not a member of this workspace');
        }

        return this.prisma.space.findMany({
            where: { workspaceId },
            include: {
                statuses: { orderBy: { position: 'asc' } },
                _count: { select: { tasks: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, userId: string) {
        const space = await this.prisma.space.findUnique({
            where: { id },
            include: {
                workspace: {
                    include: {
                        members: { where: { userId: userId } },
                    },
                },
                statuses: { orderBy: { position: 'asc' } },
                _count: { select: { tasks: true } },
            },
        });

        if (!space) throw new NotFoundException('Space not found');
        if (space.workspace.members.length === 0) {
            throw new ForbiddenException('No access to this space');
        }

        const { workspace, ...spaceData } = space;
        return spaceData;
    }

    async update(id: string, updateSpaceDto: UpdateSpaceDto, userId: string) {
        const space = await this.prisma.space.findUnique({
            where: { id },
            include: {
                workspace: { include: { members: { where: { userId } } } },
            },
        });

        if (!space || space.workspace.members.length === 0) {
            throw new NotFoundException('Space not found');
        }

        const userRole = space.workspace.members[0].role;
        if (userRole !== 'OWNER' && userRole !== 'ADMIN' && space.createdBy !== userId) {
            throw new ForbiddenException('Only space creator or workspace admins can update space');
        }

        if (updateSpaceDto.prefix) {
            const existing = await this.prisma.space.findUnique({
                where: { workspaceId_prefix: { workspaceId: space.workspaceId, prefix: updateSpaceDto.prefix } },
            });
            if (existing && existing.id !== id) {
                throw new ConflictException(`Prefix ${updateSpaceDto.prefix} is already used in this workspace`);
            }
        }

        return this.prisma.space.update({
            where: { id },
            data: updateSpaceDto,
        });
    }

    async remove(id: string, userId: string) {
        const space = await this.prisma.space.findUnique({
            where: { id },
            include: { workspace: { include: { members: { where: { userId } } } } },
        });

        if (!space || space.workspace.members.length === 0) {
            throw new NotFoundException('Space not found');
        }

        const userRole = space.workspace.members[0].role;
        if (userRole !== 'OWNER' && userRole !== 'ADMIN' && space.createdBy !== userId) {
            throw new ForbiddenException('Only space creator or workspace admins can delete space');
        }

        return this.prisma.space.delete({ where: { id } });
    }

    // Task Statuses (Columns)
    async createStatus(spaceId: string, createStatusDto: CreateStatusDto, userId: string) {
        await this.checkSpaceAdmin(spaceId, userId);

        // Check for existing status and return it instead of throwing error
        const existingStatus = await this.prisma.taskStatus.findUnique({
            where: { spaceId_name: { spaceId, name: createStatusDto.name } },
        });
        if (existingStatus) {
            // Return existing status instead of throwing error to handle duplicate creation attempts gracefully
            return existingStatus;
        }

        // Auto-assign position if not provided
        if (createStatusDto.position === undefined) {
            const lastStatus = await this.prisma.taskStatus.findFirst({
                where: { spaceId },
                orderBy: { position: 'desc' },
            });
            createStatusDto.position = lastStatus ? lastStatus.position + 1 : 0;
        }

        return this.prisma.taskStatus.create({
            data: { ...createStatusDto, spaceId },
        });
    }

    async updateStatus(spaceId: string, statusId: string, updateStatusDto: UpdateStatusDto, userId: string) {
        await this.checkSpaceAdmin(spaceId, userId);
        return this.prisma.taskStatus.update({
            where: { id: statusId },
            data: updateStatusDto,
        });
    }

    async deleteStatus(spaceId: string, statusId: string, userId: string) {
        await this.checkSpaceAdmin(spaceId, userId);

        // Check if there are tasks using this status
        const tasksCount = await this.prisma.task.count({ where: { statusId } });
        if (tasksCount > 0) {
            throw new ConflictException(`Cannot delete status with ${tasksCount} task(s). Move them first.`);
        }

        return this.prisma.taskStatus.delete({ where: { id: statusId } });
    }

    private async checkSpaceAdmin(spaceId: string, userId: string) {
        const space = await this.prisma.space.findUnique({
            where: { id: spaceId },
            include: { workspace: { include: { members: { where: { userId } } } } },
        });

        if (!space || space.workspace.members.length === 0) {
            throw new NotFoundException('Space not found');
        }

        const userRole = space.workspace.members[0].role;
        if (userRole !== 'OWNER' && userRole !== 'ADMIN' && space.createdBy !== userId) {
            throw new ForbiddenException('Permissions required');
        }

        return space;
    }

    async addDefaultStatusesToAllSpaces(workspaceId: string, userId: string) {
        // Check if user is workspace owner or admin
        const member = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
        });

        if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
            throw new ForbiddenException('Only workspace owners and admins can perform this action');
        }

        const defaultStatuses = [
            { name: 'Today', color: '#A16207', position: 0, isDone: false },
            { name: 'This Week', color: '#166534', position: 1, isDone: false },
            { name: 'Later', color: '#111111', position: 2, isDone: false },
        ];

        // Get all spaces in the workspace
        const spaces = await this.prisma.space.findMany({
            where: { workspaceId },
            include: { statuses: true },
        });

        let updatedCount = 0;

        for (const space of spaces) {
            // Check if space already has the default statuses
            const hasDefaultStatuses = defaultStatuses.every((defaultStatus) =>
                space.statuses.some((s) => s.name === defaultStatus.name)
            );

            if (!hasDefaultStatuses) {
                // Create missing default statuses
                for (const defaultStatus of defaultStatuses) {
                    const exists = space.statuses.some((s) => s.name === defaultStatus.name);
                    if (!exists) {
                        await this.prisma.taskStatus.create({
                            data: {
                                ...defaultStatus,
                                spaceId: space.id,
                            },
                        });
                    }
                }
                updatedCount++;
            }
        }

        return {
            success: true,
            spacesUpdated: updatedCount,
            totalSpaces: spaces.length,
            message: `Added default statuses to ${updatedCount} space(s)`,
        };
    }
}
