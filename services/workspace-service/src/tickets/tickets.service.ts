import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
    constructor(private prisma: PrismaService) {}

    async create(workspaceId: string, createdBy: string, title: string, description: string) {
        return this.prisma.ticket.create({
            data: {
                workspaceId,
                title,
                description,
                createdBy,
            },
        });
    }

    async findByWorkspace(workspaceId: string) {
        return this.prisma.ticket.findMany({
            where: { workspaceId },
            include: {
                creator: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                assignee: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async update(id: string, data: { status?: string; assignedTo?: string }) {
        return this.prisma.ticket.update({
            where: { id },
            data,
        });
    }
}
