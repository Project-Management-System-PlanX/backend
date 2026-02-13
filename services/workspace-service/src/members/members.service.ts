import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class MembersService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async addMember(workspaceId: string, userId: string, role: string = 'MEMBER') {
        return this.prisma.workspaceMember.create({
            data: {
                workspaceId,
                userId,
                role,
            },
        });
    }

    async findByWorkspace(workspaceId: string) {
        return this.prisma.workspaceMember.findMany({
            where: { workspaceId },
            orderBy: { joinedAt: 'asc' },
        });
    }

    async updateRole(workspaceId: string, userId: string, role: string) {
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

    async removeMember(workspaceId: string, userId: string) {
        return this.prisma.workspaceMember.deleteMany({
            where: {
                workspaceId,
                userId,
            },
        });
    }
}
