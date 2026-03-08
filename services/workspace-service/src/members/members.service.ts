import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembersService {
    constructor(private readonly prisma: PrismaService) {}

    async addMember(workspaceId: string, userId: string, role: string = 'MEMBER') {
        try {
            return await this.prisma.workspaceMember.create({
                data: {
                    workspaceId,
                    userId,
                    role,
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('User is already a member of this workspace');
            }
            throw error;
        }
    }

    async findByWorkspace(workspaceId: string) {
        return this.prisma.workspaceMember.findMany({
            where: { workspaceId },
            include: {
                user: {
                    select: {
                        id: true,
                        supabaseId: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                        imageUrl: true,
                    },
                },
            },
            orderBy: { joinedAt: 'asc' },
        });
    }

    async updateRole(workspaceId: string, userId: string, role: string, requesterId: string) {
        // Only OWNER/ADMIN can update roles
        const requester = await this.prisma.workspaceMember.findFirst({
            where: { workspaceId, userId: requesterId },
        });
        if (!requester || !['OWNER', 'ADMIN'].includes(requester.role)) {
            throw new ForbiddenException('Insufficient permissions to update member role');
        }

        const member = await this.prisma.workspaceMember.findFirst({
            where: { workspaceId, userId },
        });

        if (!member) {
            throw new NotFoundException('Member not found');
        }

        return this.prisma.workspaceMember.update({
            where: { id: member.id },
            data: { role },
        });
    }

    async removeMember(workspaceId: string, userId: string, requesterId: string) {
        // Members can remove themselves; OWNER/ADMIN can remove anyone
        const requester = await this.prisma.workspaceMember.findFirst({
            where: { workspaceId, userId: requesterId },
        });

        if (!requester) throw new NotFoundException('Requester is not a workspace member');

        const isSelf = requesterId === userId;
        const hasPermission = isSelf || ['OWNER', 'ADMIN'].includes(requester.role);

        if (!hasPermission) {
            throw new ForbiddenException('Insufficient permissions to remove this member');
        }

        return this.prisma.workspaceMember.deleteMany({
            where: { workspaceId, userId },
        });
    }
}
