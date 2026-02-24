import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateChannelDto } from './dto/create-channel.dto';

@Injectable()
export class ChannelsService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async create(createChannelDto: CreateChannelDto, createdByUserId: string) {
        const channel = await this.prisma.channel.create({
            data: createChannelDto,
        });
        // Auto-join creator as member
        await this.prisma.channelMember.create({
            data: { channelId: channel.id, userId: createdByUserId, role: 'ADMIN' },
        });
        return channel;
    }

    async findByProject(projectId: string) {
        return this.prisma.channel.findMany({
            where: { projectId },
            include: {
                members: true,
                groups: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async findOne(id: string) {
        const channel = await this.prisma.channel.findUnique({
            where: { id },
            include: {
                members: true,
                groups: true,
            },
        });

        if (!channel) {
            throw new NotFoundException('Channel not found');
        }

        return channel;
    }

    async update(id: string, updateData: Partial<CreateChannelDto>, _userId: string) {
        try {
            return await this.prisma.channel.update({
                where: { id },
                data: updateData,
            });
        } catch (_error) {
            throw new NotFoundException('Channel not found');
        }
    }

    async remove(id: string, _userId: string) {
        try {
            return await this.prisma.channel.delete({
                where: { id },
            });
        } catch (_error) {
            throw new NotFoundException('Channel not found');
        }
    }

    async addMember(channelId: string, userId: string, role: string = 'MEMBER') {
        return this.prisma.channelMember.create({
            data: {
                channelId,
                userId,
                role,
            },
        });
    }

    async removeMember(channelId: string, userId: string) {
        return this.prisma.channelMember.deleteMany({
            where: {
                channelId,
                userId,
            },
        });
    }
}
