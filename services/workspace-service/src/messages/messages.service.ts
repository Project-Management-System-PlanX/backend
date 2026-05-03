import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
    constructor(private readonly prisma: PrismaService) {}

    async create(
        channelId: string,
        userId: string,
        content: string | null,
        fileDetails?: {
            fileUrl: string;
            fileName: string;
            fileType: string;
            fileSize: number;
            duration?: number;
        },
        parentId?: string,
    ) {
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
                ...(parentId ? { parentId } : {}),
                ...(fileDetails
                    ? {
                          fileUrl: fileDetails.fileUrl,
                          fileName: fileDetails.fileName,
                          fileType: fileDetails.fileType,
                          fileSize: fileDetails.fileSize,
                          duration: fileDetails.duration || null,
                      }
                    : {}),
            },
            include: {
                parent: {
                    select: {
                        id: true,
                        content: true,
                        userId: true,
                        fileUrl: true,
                        fileName: true,
                        fileType: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                username: true,
                                email: true,
                                imageUrl: true,
                            },
                        },
                    },
                },
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
                parent: {
                    select: {
                        id: true,
                        content: true,
                        userId: true,
                        fileUrl: true,
                        fileName: true,
                        fileType: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                username: true,
                                email: true,
                                imageUrl: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
        });
    }

    async findFilesByWorkspace(workspaceId: string) {
        return this.prisma.message.findMany({
            where: {
                fileUrl: { not: null },
                deletedAt: null,
                channel: {
                    workspaceId,
                },
            },
            include: {
                user: {
                    select: {
                        supabaseId: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                        imageUrl: true,
                        email: true,
                    },
                },
                channel: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async softDelete(messageId: string, userId: string) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        if (message.userId !== userId) {
            throw new ForbiddenException('You can only delete your own messages');
        }

        return this.prisma.message.update({
            where: { id: messageId },
            data: {
                deletedAt: new Date(),
                content: '',
                fileUrl: null,
                fileName: null,
                fileType: null,
                fileSize: null,
                duration: null,
            },
        });
    }

    async update(messageId: string, userId: string, content: string) {
        if (!content) {
            throw new ForbiddenException('Message content cannot be empty');
        }

        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        if (message.userId !== userId) {
            throw new ForbiddenException('You can only edit your own messages');
        }

        if (message.deletedAt) {
            throw new ForbiddenException('Cannot edit a deleted message');
        }

        // Check if message is within the 15-minute edit window
        const now = new Date();
        const createdTime = new Date(message.createdAt);
        const diffInMinutes = (now.getTime() - createdTime.getTime()) / (1000 * 60);

        if (diffInMinutes > 15) {
            throw new ForbiddenException(
                'Messages can only be edited within 15 minutes of sending',
            );
        }

        return this.prisma.message.update({
            where: { id: messageId },
            data: {
                content,
                isEdited: true,
                updatedAt: now,
            },
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
        });
    }

    async togglePin(messageId: string, userId: string, isPinned: boolean) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        return this.prisma.message.update({
            where: { id: messageId },
            data: { isPinned },
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
        });
    }
}
