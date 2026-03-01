import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';

@Injectable()
export class ChannelsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createChannelDto: CreateChannelDto, createdByUserId: string) {
        // Verify the user is a member of the workspace
        const membership = await this.prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId: createChannelDto.workspaceId,
                    userId: createdByUserId,
                },
            },
        });

        if (!membership) {
            throw new ForbiddenException('You must be a workspace member to create a channel');
        }

        const channel = await this.prisma.channel.create({
            data: createChannelDto,
        });

        // Auto-join creator as channel ADMIN
        await this.prisma.channelMember.create({
            data: { channelId: channel.id, userId: createdByUserId, role: 'ADMIN' },
        });

        return channel;
    }

    async findByWorkspace(workspaceId: string) {
        return this.prisma.channel.findMany({
            where: { workspaceId },
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

    async update(id: string, updateData: Partial<CreateChannelDto>, userId: string) {
        const channel = await this.prisma.channel.findUnique({ where: { id } });
        if (!channel) throw new NotFoundException('Channel not found');

        await this.assertChannelPermission(channel.id, channel.workspaceId, userId);

        return this.prisma.channel.update({
            where: { id },
            data: updateData,
        });
    }

    async remove(id: string, userId: string) {
        const channel = await this.prisma.channel.findUnique({ where: { id } });
        if (!channel) throw new NotFoundException('Channel not found');

        await this.assertChannelPermission(channel.id, channel.workspaceId, userId);

        return this.prisma.channel.delete({ where: { id } });
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

    /**
     * Asserts that the user has permission to modify a channel.
     * Allowed: channel ADMIN, workspace OWNER, or workspace ADMIN.
     */
    private async assertChannelPermission(
        channelId: string,
        workspaceId: string,
        userId: string,
    ): Promise<void> {
        // Check if user is a channel ADMIN
        const channelMember = await this.prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });

        if (channelMember?.role === 'ADMIN') return;

        // Check if user is a workspace OWNER or ADMIN
        const workspaceMember = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
        });

        if (workspaceMember && ['OWNER', 'ADMIN'].includes(workspaceMember.role)) return;

        throw new ForbiddenException('Insufficient permissions to modify this channel');
    }
}
