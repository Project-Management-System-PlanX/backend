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
    constructor(private readonly prisma: PrismaService) { }

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
        const ownerMember = await this.prisma.workspaceMember.create({
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
        const memberships = await this.prisma.workspaceMember.findMany({
            where: { userId },
            include: {
                workspace: {
                    include: {
                        _count: {
                            select: {
                                members: true,
                                channels: {
                                    where: { type: { not: 'DIRECT_MESSAGE' } }
                                }
                            }
                        }
                    },
                },
            },
        });
        return memberships.map((m) => {
            const ws = m.workspace;
            return {
                ...ws,
                members: new Array(ws._count.members).fill({}),
                channels: new Array(ws._count.channels).fill({ type: 'PUBLIC' }),
            };
        });
    }

    async findAllAdmin() {
        // Super Admin call to see ALL workspaces in the system, mapped directly to their managers
        return this.prisma.workspace.findMany({
            include: {
                members: {
                    include: { user: true }
                },
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async transferOwnership(workspaceId: string, newOwnerId: string) {
        const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
        if (!workspace) throw new NotFoundException('Workspace not found');

        // Demote the old owner to ADMIN
        const oldOwnerMember = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId: workspace.ownerId } }
        });
        if (oldOwnerMember) {
            await this.prisma.workspaceMember.update({
                where: { workspaceId_userId: { workspaceId, userId: workspace.ownerId } },
                data: { role: 'ADMIN' }
            });
        }

        // Add or promote new owner
        const existingMember = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId: newOwnerId } }
        });
        if (existingMember) {
            await this.prisma.workspaceMember.update({
                where: { workspaceId_userId: { workspaceId, userId: newOwnerId } },
                data: { role: 'OWNER' }
            });
        } else {
            await this.prisma.workspaceMember.create({
                data: {
                    workspaceId,
                    userId: newOwnerId,
                    role: 'OWNER'
                }
            });
        }

        // Update the workspace's primary ownerId link
        return this.prisma.workspace.update({
            where: { id: workspaceId },
            data: { ownerId: newOwnerId }
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

        return {
            ...workspace,
            members: workspace.members,
        };
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

    async createInvite(workspaceId: string, userId: string) {
        // Verify user is OWNER or ADMIN
        const member = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
        });
        if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
            throw new ForbiddenException('Only owners and admins can create invite links');
        }

        const invite = await this.prisma.workspaceInvite.create({
            data: {
                workspaceId: workspaceId,
                createdBy: userId,
            },
        });

        return invite;
    }

    async getInvite(token: string) {
        const invite = await this.prisma.workspaceInvite.findUnique({
            where: { token },
            include: { workspace: true },
        });

        if (!invite) {
            throw new NotFoundException('Invite not found or expired');
        }

        return invite;
    }

    async acceptInvite(token: string, userId: string) {
        const invite = await this.prisma.workspaceInvite.findUnique({
            where: { token },
            include: { workspace: true },
        });

        if (!invite) {
            throw new NotFoundException('Invite not found or expired');
        }

        // Check if already a member
        const existingMember = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId } },
        });

        if (existingMember) {
            return { workspace: invite.workspace, alreadyMember: true };
        }

        // Add as member
        await this.prisma.workspaceMember.create({
            data: {
                workspaceId: invite.workspaceId,
                userId,
                role: 'MEMBER',
            },
        });

        // Increment use count
        await this.prisma.workspaceInvite.update({
            where: { token },
            data: { useCount: { increment: 1 } },
        });

        return { workspace: invite.workspace, alreadyMember: false };
    }
}
