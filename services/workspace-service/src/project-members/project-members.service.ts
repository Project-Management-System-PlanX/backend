import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, ProjectRole } from '@prisma/client';

@Injectable()
export class ProjectMembersService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async addMember(projectId: string, userId: string, role: string = 'EMPLOYEE') {
        const assignedRole = role as ProjectRole;
        return this.prisma.projectMember.create({
            data: {
                projectId,
                userId,
                role: assignedRole,
            },
        });
    }

    async findByProject(projectId: string) {
        return this.prisma.projectMember.findMany({
            where: { projectId },
            orderBy: { joinedAt: 'asc' },
        });
    }

    async updateRole(projectId: string, userId: string, role: string, requesterId: string) {
        // Only MANAGER can update roles
        const requester = await this.prisma.projectMember.findFirst({
            where: { projectId, userId: requesterId },
        });
        if (!requester || !['MANAGER'].includes(requester.role)) {
            throw new ForbiddenException('Insufficient permissions to update member role');
        }

        const member = await this.prisma.projectMember.findFirst({
            where: { projectId, userId },
        });

        if (!member) {
            throw new NotFoundException('Member not found');
        }

        const assignedRole = role as ProjectRole;
        return this.prisma.projectMember.update({
            where: { id: member.id },
            data: { role: assignedRole },
        });
    }

    async removeMember(projectId: string, userId: string, requesterId: string) {
        // Members can remove themselves; MANAGER can remove anyone
        const requester = await this.prisma.projectMember.findFirst({
            where: { projectId, userId: requesterId },
        });

        if (!requester) throw new NotFoundException('Requester is not a project member');

        const isSelf = requesterId === userId;
        const hasPermission = isSelf || ['MANAGER'].includes(requester.role);

        if (!hasPermission) {
            throw new ForbiddenException('Insufficient permissions to remove this member');
        }

        return this.prisma.projectMember.deleteMany({
            where: { projectId, userId },
        });
    }
}

