import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(channelId: string, userId: string, content: string | null, fileDetails?: {
        fileUrl: string;
        fileName: string;
        fileType: string;
        fileSize: number;
    }) {
        // Verify the channel exists
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId },
        });

        if (!channel) {
            throw new NotFoundException('Channel not found');
        }

        const now = new Date();

        return this.prisma.message.create({
            data: {
                id: crypto.randomUUID(),
                channelId,
                userId,
                content: content || '',
                updatedAt: now,
                ...(fileDetails ? {
                    fileUrl: fileDetails.fileUrl,
                    fileName: fileDetails.fileName,
                    fileType: fileDetails.fileType,
                    fileSize: fileDetails.fileSize,
                } : {}),
            },
        });
    }

    async findByChannel(channelId: string, limit = 50) {
        return this.prisma.message.findMany({
            where: { channelId },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        username: true,
                        imageUrl: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
        });
    }

    async getUnreadCounts(workspaceId: string, userId: string) {
        // Get all channels in the workspace
        const channels = await this.prisma.channel.findMany({
            where: { workspaceId },
            select: { id: true },
        });

        const unreadCounts = [];

        for (const channel of channels) {
            // Get the last message the user has read in this channel
            const lastReadMessage = await this.prisma.channelMessageRead.findUnique({
                where: { channelId_userId: { channelId: channel.id, userId } },
                select: { messageId: true, readAt: true },
            });

            // Count unread messages (newer than the last read message, or all if none read)
            const unreadCount = await this.prisma.message.count({
                where: {
                    channelId: channel.id,
                    ...(lastReadMessage
                        ? {
                            createdAt: {
                                gt: await this.getMessageDate(lastReadMessage.messageId),
                            },
                        }
                        : {}),
                },
            });

            unreadCounts.push({
                channelId: channel.id,
                count: unreadCount,
                lastReadMessageId: lastReadMessage?.messageId || null,
            });
        }

        return unreadCounts;
    }

    private async getMessageDate(messageId: string) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            select: { createdAt: true },
        });
        return message?.createdAt || new Date(0);
    }

    async markChannelAsRead(channelId: string, userId: string, lastMessageId: string) {
        // Verify the message exists
        const message = await this.prisma.message.findUnique({
            where: { id: lastMessageId },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        // Upsert the read record
        return this.prisma.channelMessageRead.upsert({
            where: { channelId_userId: { channelId, userId } },
            update: { messageId: lastMessageId, readAt: new Date() },
            create: {
                id: crypto.randomUUID(),
                channelId,
                userId,
                messageId: lastMessageId,
            },
        });
    }
}
