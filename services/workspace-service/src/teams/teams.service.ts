import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamsService {
    constructor(private prisma: PrismaService) {}

    async create(workspaceId: string, name: string, description: string) {
        return this.prisma.team.create({
            data: {
                workspaceId,
                name,
                description,
            },
        });
    }

    async findByWorkspace(workspaceId: string) {
        return this.prisma.team.findMany({
            where: { workspaceId },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                                imageUrl: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async addMember(teamId: string, userId: string, role: string) {
        return this.prisma.teamMember.create({
            data: {
                teamId,
                userId,
                role,
            },
        });
    }

    async removeMember(teamId: string, userId: string) {
        return this.prisma.teamMember.delete({
            where: {
                teamId_userId: {
                    teamId,
                    userId,
                },
            },
        });
    }
}
