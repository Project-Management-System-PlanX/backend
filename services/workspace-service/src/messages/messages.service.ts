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
}
