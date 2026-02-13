import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async create(createGroupDto: CreateGroupDto) {
        return this.prisma.group.create({
            data: createGroupDto,
        });
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

    async update(id: string, updateData: Partial<CreateGroupDto>) {
        try {
            return await this.prisma.group.update({
                where: { id },
                data: updateData,
            });
        } catch (error) {
            throw new NotFoundException('Group not found');
        }
    }

    async remove(id: string) {
        try {
            return await this.prisma.group.delete({
                where: { id },
            });
        } catch (error) {
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
