import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async create(createWorkspaceDto: CreateWorkspaceDto) {
        // Check if slug already exists
        const existing = await this.prisma.workspace.findUnique({
            where: { slug: createWorkspaceDto.slug },
        });

        if (existing) {
            throw new ConflictException('Workspace with this slug already exists');
        }

        const workspace = await this.prisma.workspace.create({
            data: createWorkspaceDto,
        });

        // Add owner as a member
        await this.prisma.workspaceMember.create({
            data: {
                workspaceId: workspace.id,
                userId: createWorkspaceDto.ownerId,
                role: 'OWNER',
            },
        });

        return workspace;
    }

    async findAll(userId?: string) {
        if (userId) {
            // Find workspaces where user is a member
            const memberships = await this.prisma.workspaceMember.findMany({
                where: { userId },
                include: { workspace: true },
            });
            return memberships.map((m) => m.workspace);
        }

        return this.prisma.workspace.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const workspace = await this.prisma.workspace.findUnique({
            where: { id },
            include: {
                members: true,
                channels: true,
            },
        });

        if (!workspace) {
            throw new NotFoundException('Workspace not found');
        }

        return workspace;
    }

    async update(id: string, updateWorkspaceDto: UpdateWorkspaceDto) {
        try {
            return await this.prisma.workspace.update({
                where: { id },
                data: updateWorkspaceDto,
            });
        } catch (_error) {
            throw new NotFoundException('Workspace not found');
        }
    }

    async remove(id: string) {
        try {
            return await this.prisma.workspace.delete({
                where: { id },
            });
        } catch (_error) {
            throw new NotFoundException('Workspace not found');
        }
    }
}
