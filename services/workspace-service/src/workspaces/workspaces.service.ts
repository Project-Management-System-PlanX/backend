import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createWorkspaceDto: CreateWorkspaceDto, ownerId: string) {
        // Check if slug already exists
        const existing = await this.prisma.workspace.findUnique({
            where: { slug: createWorkspaceDto.slug },
        });

        if (existing) {
            throw new ConflictException('Workspace with this slug already exists');
        }

        const workspace = await this.prisma.workspace.create({
            data: {
                ...createWorkspaceDto,
                ownerId, // Injected from Supabase auth — never from request body
            },
        });

        // Add owner as a member automatically
        await this.prisma.workspaceMember.create({
            data: {
                workspaceId: workspace.id,
                userId: ownerId,
                role: 'OWNER',
            },
        });

        return workspace;
    }

    async findAll(userId: string) {
        // Always return workspaces where the authenticated user is a member
        const memberships = await this.prisma.workspaceMember.findMany({
            where: { userId },
            include: {
                workspace: {
                    include: {
                        channels: true,
                        members: true,
                    },
                },
            },
        });
        return memberships.map((m) => m.workspace);
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

    async update(id: string, updateWorkspaceDto: UpdateWorkspaceDto, userId: string) {
        const workspace = await this.prisma.workspace.findUnique({ where: { id } });
        if (!workspace) throw new NotFoundException('Workspace not found');

        // Only OWNER or ADMIN can update
        const member = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId: id, userId } },
        });
        if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
            throw new ForbiddenException('Insufficient permissions to update workspace');
        }

        return this.prisma.workspace.update({
            where: { id },
            data: updateWorkspaceDto,
        });
    }

    async remove(id: string, userId: string) {
        const workspace = await this.prisma.workspace.findUnique({ where: { id } });
        if (!workspace) throw new NotFoundException('Workspace not found');

        // Only OWNER can delete
        if (workspace.ownerId !== userId) {
            throw new ForbiddenException('Only the workspace owner can delete it');
        }

        return this.prisma.workspace.delete({ where: { id } });
    }
}
