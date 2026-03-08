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
        },
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
                ...(fileDetails
                    ? {
                          fileUrl: fileDetails.fileUrl,
                          fileName: fileDetails.fileName,
                          fileType: fileDetails.fileType,
                          fileSize: fileDetails.fileSize,
                      }
                    : {}),
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
            },
        });
    }
}
