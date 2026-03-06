import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { JoinMeetingDto } from './dto/join-meeting.dto';
import { MeetingsService } from './meetings.service';

@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingsController {
    constructor(private readonly meetingsService: MeetingsService) {}

    /**
     * POST /meetings/create
     * Create a new meeting
     */
    @Post('create')
    async createMeeting(
        @Body() createMeetingDto: CreateMeetingDto,
        @Req() req: AuthenticatedRequest,
    ) {
        const meeting = await this.meetingsService.createMeeting({
            title: createMeetingDto.title,
            groupId: createMeetingDto.groupId,
            channelId: createMeetingDto.channelId,
            workspaceId: createMeetingDto.workspaceId,
            type: createMeetingDto.type,
            createdById: req.user.userId,
        });

        return {
            success: true,
            data: meeting,
        };
    }

    /**
     * POST /meetings/:id/join
     * Join an existing meeting
     */
    @Post(':id/join')
    async joinMeeting(
        @Param('id') id: string,
        @Body() joinMeetingDto: JoinMeetingDto,
        @Req() req: AuthenticatedRequest,
    ) {
        const username = joinMeetingDto.username || req.user.email;
        const result = await this.meetingsService.joinMeeting(id, req.user.userId, username);

        return {
            success: true,
            data: result,
        };
    }

    /**
     * POST /meetings/:id/leave
     * Leave a meeting
     */
    @Post(':id/leave')
    async leaveMeeting(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
        await this.meetingsService.leaveMeeting(id, req.user.userId);

        return {
            success: true,
            message: 'Left meeting successfully',
        };
    }

    /**
     * POST /meetings/:id/end
     * End a meeting (only creator can end)
     */
    @Post(':id/end')
    async endMeeting(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
        await this.meetingsService.endMeeting(id, req.user.userId);

        return {
            success: true,
            message: 'Meeting ended successfully',
        };
    }

    /**
     * GET /meetings/active
     * Get all active meetings (optionally filtered by group)
     */
    @Get('active')
    async getActiveMeetings(@Query('groupId') groupId?: string) {
        const meetings = await this.meetingsService.getActiveMeetings(groupId);

        return {
            success: true,
            data: meetings,
        };
    }

    /**
     * GET /meetings/history
     * Get meeting history for the current user
     */
    @Get('history')
    async getMeetingHistory(@Req() req: AuthenticatedRequest) {
        const meetings = await this.meetingsService.getMeetingHistory(req.user.userId);

        return {
            success: true,
            data: meetings,
        };
    }

    /**
     * GET /meetings/:id
     * Get a single meeting by ID
     */
    @Get(':id')
    async getMeeting(@Param('id') id: string) {
        const meeting = await this.meetingsService.getMeetingById(id);

        return {
            success: true,
            data: meeting,
        };
    }
}
