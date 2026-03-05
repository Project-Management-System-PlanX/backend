import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createGroupDto: CreateGroupDto, createdByUserId: string) {
        // Verify channel exists and user is a channel member
        const channel = await this.prisma.channels.findUnique({
            where: { id: createGroupDto.channelId },
        });

        if (!channel) {
            throw new NotFoundException('Channel not found');
        }

        const channelMember = await this.prisma.channel_members.findUnique({
            where: {
                channelId_userId: {
                    channelId: createGroupDto.channelId,
                    userId: createdByUserId,
                },
            },
        });

        if (!channelMember) {
            throw new ForbiddenException('You must be a channel member to create a group');
        }

        const group = await this.prisma.groups.create({
            data: createGroupDto,
        });

        // Auto-join creator as group member
        await this.prisma.group_members.create({
            data: { groupId: group.id, userId: createdByUserId },
        });

        return group;
    }

    async findByChannel(channelId: string) {
        return this.prisma.groups.findMany({
            where: { channelId },
            include: { group_members: true },
            orderBy: { createdAt: 'asc' },
        });
    }

    async findOne(id: string) {
        const group = await this.prisma.groups.findUnique({
            where: { id },
            include: { group_members: true },
        });

        if (!group) {
            throw new NotFoundException('Group not found');
        }

        return group;
    }

    async update(id: string, updateData: Partial<CreateGroupDto>, userId: string) {
        const group = await this.prisma.groups.findUnique({
            where: { id },
            include: { channels: true },
        });
        if (!group) throw new NotFoundException('Group not found');

        await this.assertGroupPermission(group.channelId, group.channels.workspaceId, userId);

        return this.prisma.groups.update({
            where: { id },
            data: updateData,
        });
    }

    async remove(id: string, userId: string) {
        const group = await this.prisma.groups.findUnique({
            where: { id },
            include: { channels: true },
        });
        if (!group) throw new NotFoundException('Group not found');

        await this.assertGroupPermission(group.channelId, group.channels.workspaceId, userId);

        return this.prisma.groups.delete({ where: { id } });
    }

    async addMember(groupId: string, userId: string) {
        return this.prisma.group_members.create({
            data: {
                groupId,
                userId,
            },
        });
    }

    async removeMember(groupId: string, userId: string) {
        return this.prisma.group_members.deleteMany({
            where: {
                groupId,
                userId,
            },
        });
    }

    /**
     * Asserts that the user has permission to modify a group.
     * Allowed: channel ADMIN, workspace OWNER, or workspace ADMIN.
     */
    private async assertGroupPermission(
        channelId: string,
        workspaceId: string,
        userId: string,
    ): Promise<void> {
        // Check if user is a channel ADMIN
        const channelMember = await this.prisma.channel_members.findUnique({
            where: { channelId_userId: { channelId, userId } },
        });

        if (channelMember?.role === 'ADMIN') return;

        // Check if user is a workspace OWNER or ADMIN
        const workspaceMember = await this.prisma.workspace_members.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
        });

        if (workspaceMember && ['OWNER', 'ADMIN'].includes(workspaceMember.role)) return;

        throw new ForbiddenException('Insufficient permissions to modify this group');
    }
}
