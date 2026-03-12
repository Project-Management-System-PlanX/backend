import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReadStateService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Mark a channel as read for a user (upsert)
     */
    async markAsRead(channelId: string, userId: string, messageId?: string) {
        return this.prisma.messageReadState.upsert({
            where: {
                channelId_userId: { channelId, userId },
            },
            create: {
                channelId,
                userId,
                lastReadAt: new Date(),
                lastReadMessageId: messageId || null,
            },
            update: {
                lastReadAt: new Date(),
                lastReadMessageId: messageId || undefined,
            },
        });
    }

    /**
     * Get unread message counts for a list of channels
     */
    async getUnreadCounts(userId: string, workspaceId: string) {
        // Get all channels this user belongs to in the workspace
        const channelMemberships = await this.prisma.channelMember.findMany({
            where: {
                userId,
                channel: { workspaceId },
            },
            select: { channelId: true },
        });

        const channelIds = channelMemberships.map((m) => m.channelId);

        if (channelIds.length === 0) return [];

        // Get the last read state for each channel
        const readStates = await this.prisma.messageReadState.findMany({
            where: {
                userId,
                channelId: { in: channelIds },
            },
        });

        const readStateMap = new Map(readStates.map((rs) => [rs.channelId, rs]));

        // Count unread messages for each channel
        const results = await Promise.all(
            channelIds.map(async (channelId) => {
                const readState = readStateMap.get(channelId);
                const lastReadAt = readState?.lastReadAt;

                const count = await this.prisma.message.count({
                    where: {
                        channelId,
                        deletedAt: null,
                        userId: { not: userId }, // Don't count own messages
                        ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
                    },
                });

                return {
                    channelId,
                    count,
                    lastReadAt: lastReadAt?.toISOString() || null,
                    lastReadMessageId: readState?.lastReadMessageId || null,
                };
            }),
        );

        return results;
    }

    /**
     * Get the read state for a specific channel and user
     */
    async getReadState(channelId: string, userId: string) {
        return this.prisma.messageReadState.findUnique({
            where: {
                channelId_userId: { channelId, userId },
            },
        });
    }
}
