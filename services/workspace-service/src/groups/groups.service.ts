import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async create(createGroupDto: CreateGroupDto, createdByUserId: string) {
        const group = await this.prisma.group.create({
            data: createGroupDto,
        });
        // Auto-join creator as group member
        await this.prisma.groupMember.create({
            data: { groupId: group.id, userId: createdByUserId },
        });
        return group;
    }

    async findByChannel(channelId: string) {
        return this.prisma.group.findMany({
            where: { channelId },
            include: { members: true },
            orderBy: { createdAt: 'asc' },
        });
    }

    async findOne(id: string) {
        const group = await this.prisma.group.findUnique({
            where: { id },
            include: { members: true },
        });

        if (!group) {
            throw new NotFoundException('Group not found');
        }

        return group;
    }

    async update(id: string, updateData: Partial<CreateGroupDto>, _userId: string) {
        try {
            return await this.prisma.group.update({
                where: { id },
                data: updateData,
            });
        } catch (_error) {
            throw new NotFoundException('Group not found');
        }
    }

    async remove(id: string, _userId: string) {
        try {
            return await this.prisma.group.delete({
                where: { id },
            });
        } catch (_error) {
            throw new NotFoundException('Group not found');
        }
    }

    async addMember(groupId: string, userId: string) {
        return this.prisma.groupMember.create({
            data: {
                groupId,
                userId,
            },
        });
    }

    async removeMember(groupId: string, userId: string) {
        return this.prisma.groupMember.deleteMany({
            where: {
                groupId,
                userId,
            },
        });
    }
}
