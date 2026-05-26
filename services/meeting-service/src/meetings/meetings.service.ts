import { randomBytes } from 'node:crypto';
import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { MeetingStatus, meetings } from '@prisma/client-meeting';
import { LivekitService } from '../livekit/livekit.service';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateMeetingData {
    title: string;
    groupId?: string;
    channelId?: string;
    workspaceId?: string;
    type?: 'VIDEO' | 'AUDIO';
    createdById: string;
}

export interface JoinMeetingResponse {
    token: string;
    url: string;
    meeting: meetings;
}

@Injectable()
export class MeetingsService {
    constructor(
        private prisma: PrismaService,
        private livekitService: LivekitService,
    ) {}

    /**
     * Generate a unique room ID
     */
    private generateRoomId(): string {
        const timestamp = Date.now();
        const randomString = randomBytes(4).toString('hex');
        return `room_${timestamp}_${randomString}`;
    }

    /**
     * Create a new meeting
     */
    async createMeeting(data: CreateMeetingData): Promise<meetings> {
        const roomId = this.generateRoomId();

        const meeting = await this.prisma.meetings.create({
            data: {
                roomId,
                title: data.title,
                type: data.type || 'VIDEO',
                status: 'ACTIVE',
                groupId: data.groupId || null,
                channelId: data.channelId || null,
                workspaceId: data.workspaceId || null,
                createdById: data.createdById,
            },
        });

        return meeting;
    }

    /**
     * Join an existing meeting
     */
    async joinMeeting(
        meetingId: string,
        userId: string,
        username: string,
    ): Promise<JoinMeetingResponse> {
        // Get the meeting
        const meeting = await this.prisma.meetings.findUnique({
            where: { id: meetingId },
        });

        if (!meeting) {
            throw new NotFoundException('Meeting not found');
        }

        if (meeting.status !== 'ACTIVE') {
            throw new BadRequestException('Meeting is not active');
        }

        // Upsert participant (insert or update if exists)
        await this.prisma.meeting_participants.upsert({
            where: {
                meetingId_userId: {
                    meetingId,
                    userId,
                },
            },
            create: {
                meetingId,
                userId,
                joinedAt: new Date(),
            },
            update: {
                joinedAt: new Date(),
                leftAt: null, // Reset if rejoining
            },
        });

        // Generate Livekit token
        const { token, url } = await this.livekitService.generateToken(
            meeting.roomId,
            userId,
            username,
        );

        return {
            token,
            url,
            meeting,
        };
    }

    /**
     * Leave a meeting
     */
    async leaveMeeting(meetingId: string, userId: string): Promise<void> {
        // Get the participant record
        const participant = await this.prisma.meeting_participants.findUnique({
            where: {
                meetingId_userId: {
                    meetingId,
                    userId,
                },
            },
        });

        if (!participant) {
            throw new NotFoundException('Participant not found in meeting');
        }

        // Calculate duration in minutes
        const joinedAt = new Date(participant.joinedAt);
        const leftAt = new Date();
        const durationMinutes = Math.round((leftAt.getTime() - joinedAt.getTime()) / 60000);

        // Update participant record
        await this.prisma.meeting_participants.update({
            where: {
                meetingId_userId: {
                    meetingId,
                    userId,
                },
            },
            data: {
                leftAt,
                duration: durationMinutes,
            },
        });
    }

    /**
     * End a meeting (only creator can end)
     */
    async endMeeting(meetingId: string, userId: string): Promise<void> {
        // Get the meeting
        const meeting = await this.prisma.meetings.findUnique({
            where: { id: meetingId },
        });

        if (!meeting) {
            throw new NotFoundException('Meeting not found');
        }

        // Check if user is the creator
        if (meeting.createdById !== userId) {
            throw new ForbiddenException('Only the meeting creator can end the meeting');
        }

        // Calculate duration
        const startedAt = new Date(meeting.startedAt);
        const endedAt = new Date();
        const durationMinutes = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000);

        // Update meeting status
        await this.prisma.meetings.update({
            where: { id: meetingId },
            data: {
                status: 'ENDED',
                endedAt,
                duration: durationMinutes,
            },
        });

        // Update all participants who haven't left yet
        await this.prisma.meeting_participants.updateMany({
            where: {
                meetingId,
                leftAt: null,
            },
            data: {
                leftAt: endedAt,
            },
        });
    }

    /**
     * Get active meetings (optionally filtered by group)
     */
    async getActiveMeetings(
        groupId?: string,
    ): Promise<(meetings & { participantCount: number })[]> {
        const where: { status: MeetingStatus; groupId?: string } = {
            status: 'ACTIVE' as MeetingStatus,
        };

        if (groupId) {
            where.groupId = groupId;
        }

        const meetingsList = await this.prisma.meetings.findMany({
            where,
            include: {
                _count: {
                    select: { participants: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return meetingsList.map((meeting) => ({
            ...meeting,
            participantCount: meeting._count.participants,
        }));
    }

    /**
     * Get meeting history for a user
     */
    async getMeetingHistory(userId: string): Promise<(meetings & { participantCount: number })[]> {
        // Get meetings where user was a participant
        const participantRecords = await this.prisma.meeting_participants.findMany({
            where: { userId },
            select: { meetingId: true },
        });

        if (participantRecords.length === 0) {
            return [];
        }

        const meetingIds = participantRecords.map((p) => p.meetingId);

        const meetingsList = await this.prisma.meetings.findMany({
            where: {
                id: { in: meetingIds },
            },
            include: {
                _count: {
                    select: { participants: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return meetingsList.map((meeting) => ({
            ...meeting,
            participantCount: meeting._count.participants,
        }));
    }

    /**
     * Get a single meeting by ID
     */
    async getMeetingById(meetingId: string): Promise<meetings> {
        const meeting = await this.prisma.meetings.findUnique({
            where: { id: meetingId },
        });

        if (!meeting) {
            throw new NotFoundException('Meeting not found');
        }

        return meeting;
    }
}
