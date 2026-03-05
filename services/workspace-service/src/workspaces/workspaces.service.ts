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
        const existing = await this.prisma.workspaces.findUnique({
            where: { slug: createWorkspaceDto.slug },
        });

        if (existing) {
            throw new ConflictException('Workspace with this slug already exists');
        }

        const workspace = await this.prisma.workspaces.create({
            data: {
                ...createWorkspaceDto,
                ownerId, // Injected from Supabase auth — never from request body
            },
        });

        // Add owner as a member automatically
        const ownerMember = await this.prisma.workspace_members.create({
            data: {
                workspaceId: workspace.id,
                userId: ownerId,
                role: 'OWNER',
            },
        });

        return {
            ...workspace,
            members: [ownerMember],
            channels: [],
        };
    }

    async findAll(userId: string) {
        // Always return workspaces where the authenticated user is a member
        const memberships = await this.prisma.workspace_members.findMany({
            where: { userId },
            include: {
                workspaces: {
                    include: {
                        channels: true,
                        workspace_members: true,
                    },
                },
            },
        });
        return memberships.map((m) => {
            const ws = m.workspaces;
            return {
                ...ws,
                members: ws.workspace_members,
            };
        });
    }

    async findOne(id: string) {
        const workspace = await this.prisma.workspaces.findUnique({
            where: { id },
            include: {
                workspace_members: true,
                channels: true,
            },
        });

        if (!workspace) {
            throw new NotFoundException('Workspace not found');
        }

        return {
            ...workspace,
            members: workspace.workspace_members,
        };
    }

    async update(id: string, updateWorkspaceDto: UpdateWorkspaceDto, userId: string) {
        const workspace = await this.prisma.workspaces.findUnique({ where: { id } });
        if (!workspace) throw new NotFoundException('Workspace not found');

        // Only OWNER or ADMIN can update
        const member = await this.prisma.workspace_members.findUnique({
            where: { workspaceId_userId: { workspaceId: id, userId } },
        });
        if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
            throw new ForbiddenException('Insufficient permissions to update workspace');
        }

        return this.prisma.workspaces.update({
            where: { id },
            data: updateWorkspaceDto,
        });
    }

    async remove(id: string, userId: string) {
        const workspace = await this.prisma.workspaces.findUnique({ where: { id } });
        if (!workspace) throw new NotFoundException('Workspace not found');

        // Only OWNER can delete
        if (workspace.ownerId !== userId) {
            throw new ForbiddenException('Only the workspace owner can delete it');
        }

        return this.prisma.workspaces.delete({ where: { id } });
    }

    async createInvite(workspaceId: string, userId: string) {
        // Verify user is OWNER or ADMIN
        const member = await this.prisma.workspace_members.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
        });
        if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
            throw new ForbiddenException('Only owners and admins can create invite links');
        }

        const invite = await this.prisma.workspace_invites.create({
            data: {
                workspace_id: workspaceId,
                created_by: userId,
            },
        });

        return invite;
    }

    async getInvite(token: string) {
        const invite = await this.prisma.workspace_invites.findUnique({
            where: { token },
            include: { workspaces: true },
        });

        if (!invite) {
            throw new NotFoundException('Invite not found or expired');
        }

        return invite;
    }

    async acceptInvite(token: string, userId: string) {
        const invite = await this.prisma.workspace_invites.findUnique({
            where: { token },
            include: { workspaces: true },
        });

        if (!invite) {
            throw new NotFoundException('Invite not found or expired');
        }

        // Check if already a member
        const existingMember = await this.prisma.workspace_members.findUnique({
            where: { workspaceId_userId: { workspaceId: invite.workspace_id, userId } },
        });

        if (existingMember) {
            return { workspace: invite.workspaces, alreadyMember: true };
        }

        // Add as member
        await this.prisma.workspace_members.create({
            data: {
                workspaceId: invite.workspace_id,
                userId,
                role: 'MEMBER',
            },
        });

        // Increment use count
        await this.prisma.workspace_invites.update({
            where: { token },
            data: { use_count: { increment: 1 } },
        });

        return { workspace: invite.workspaces, alreadyMember: false };
    }
}
