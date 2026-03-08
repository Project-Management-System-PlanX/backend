import {
    ConflictException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
    private readonly logger = new Logger(WorkspacesService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
    ) {}

    async create(createWorkspaceDto: CreateWorkspaceDto, ownerId: string) {
        // Check if slug already exists
        const existing = await this.prisma.workspace.findUnique({
            where: { slug: createWorkspaceDto.slug },
        });

        if (existing) {
            throw new ConflictException('Workspace with this slug already exists');
        }

        const workspace = await this.prisma.workspace.create({
            data: {
                ...createWorkspaceDto,
                ownerId, // Injected from Supabase auth — never from request body
            },
        });

        // Add owner as a member automatically
        const ownerMember = await this.prisma.workspaceMember.create({
            data: {
                workspaceId: workspace.id,
                userId: ownerId,
                role: 'OWNER',
            },
        });

        return {
            ...workspace,
            members: [ownerMember],
            channels: [],
        };
    }

    async findAll(userId: string) {
        // Always return workspaces where the authenticated user is a member
        const memberships = await this.prisma.workspaceMember.findMany({
            where: { userId },
            include: {
                workspace: {
                    include: {
                        _count: {
                            select: {
                                members: true,
                                channels: {
                                    where: { type: { not: 'DIRECT_MESSAGE' } },
                                },
                            },
                        },
                    },
                },
            },
        });
        return memberships.map((m) => {
            const ws = m.workspace;
            return {
                ...ws,
                members: new Array(ws._count.members).fill({}),
                channels: new Array(ws._count.channels).fill({ type: 'PUBLIC' }),
            };
        });
    }

    async findAllAdmin() {
        // Super Admin call to see ALL workspaces in the system, mapped directly to their managers
        return this.prisma.workspace.findMany({
            include: {
                members: {
                    include: { user: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async transferOwnership(workspaceId: string, newOwnerId: string) {
        const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
        if (!workspace) throw new NotFoundException('Workspace not found');

        // Demote the old owner to ADMIN
        const oldOwnerMember = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId: workspace.ownerId } },
        });
        if (oldOwnerMember) {
            await this.prisma.workspaceMember.update({
                where: { workspaceId_userId: { workspaceId, userId: workspace.ownerId } },
                data: { role: 'ADMIN' },
            });
        }

        // Add or promote new owner
        const existingMember = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId: newOwnerId } },
        });
        if (existingMember) {
            await this.prisma.workspaceMember.update({
                where: { workspaceId_userId: { workspaceId, userId: newOwnerId } },
                data: { role: 'OWNER' },
            });
        } else {
            await this.prisma.workspaceMember.create({
                data: {
                    workspaceId,
                    userId: newOwnerId,
                    role: 'OWNER',
                },
            });
        }

        // Update the workspace's primary ownerId link
        return this.prisma.workspace.update({
            where: { id: workspaceId },
            data: { ownerId: newOwnerId },
        });
    }

    async findOne(id: string) {
        const workspace = await this.prisma.workspace.findUnique({
            where: { id },
            include: {
                members: true,
                channels: true,
            },
        });

        if (!workspace) {
            throw new NotFoundException('Workspace not found');
        }

        return {
            ...workspace,
            members: workspace.members,
        };
    }

    async getAnalytics(id: string, userId: string) {
        // verify membership
        const member = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId: id, userId } },
        });
        if (!member) throw new ForbiddenException('Not a member of this workspace');

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Parallel counts for dashboard stats
        const [
            teamMembers,
            activeTasks,
            completedTasks,
            totalMessages,
            filesShared,
            recentMessages,
            activeChannels,
            upcomingDeadlines,
            recentActivity,
        ] = await Promise.all([
            this.prisma.workspaceMember.count({ where: { workspaceId: id } }),

            // Tasks assigned to anyone in this workspace's spaces that are NOT done
            this.prisma.task.count({
                where: { space: { workspaceId: id }, status: { isDone: false } },
            }),

            // Tasks that ARE done
            this.prisma.task.count({
                where: { space: { workspaceId: id }, status: { isDone: true } },
            }),

            // Total messages in all channels of this workspace
            this.prisma.message.count({
                where: { channel: { workspaceId: id } },
            }),

            // Files shared (attachments on tasks)
            this.prisma.taskAttachment
                .count({
                    where: { task: { space: { workspaceId: id } } },
                })
                .catch(() => 0),

            // Messages for weekly activity chart (last 7 days)
            this.prisma.message.findMany({
                where: { channel: { workspaceId: id }, createdAt: { gte: sevenDaysAgo } },
                select: { createdAt: true },
            }),

            // Top active channels (exclude DMs)
            this.prisma.channel.findMany({
                where: { workspaceId: id, type: { not: 'DIRECT_MESSAGE' } },
                include: { _count: { select: { messages: true } } },
                orderBy: { messages: { _count: 'desc' } },
                take: 5,
            }),

            // Upcoming Deadlines (Next 5 incomplete tasks with due dates)
            this.prisma.task.findMany({
                where: {
                    space: { workspaceId: id },
                    status: { isDone: false },
                    dueDate: { not: null },
                },
                orderBy: { dueDate: 'asc' },
                take: 5,
                include: { space: true },
            }),

            // Recent Activity (Last 5 messages)
            this.prisma.message.findMany({
                where: { channel: { workspaceId: id } },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { user: true, channel: true },
            }),
        ]);

        // Process Weekly Activity into a day-by-day array
        const weeklyActivityMap = new Map<string, number>();
        // Initialize last 7 days to 0
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            weeklyActivityMap.set(d.toLocaleDateString(undefined, { weekday: 'short' }), 0);
        }
        for (const msg of recentMessages) {
            const dayLabel = msg.createdAt.toLocaleDateString(undefined, { weekday: 'short' });
            if (weeklyActivityMap.has(dayLabel)) {
                weeklyActivityMap.set(dayLabel, weeklyActivityMap.get(dayLabel)! + 1);
            }
        }
        const weeklyActivity = Array.from(weeklyActivityMap.entries()).map(([day, count]) => ({
            day,
            count,
        }));

        return {
            teamMembers,
            activeTasks,
            completedTasks,
            totalMessages,
            filesShared,
            weeklyActivity,
            activeChannels,
            upcomingDeadlines,
            recentActivity,
        };
    }

    async update(id: string, updateWorkspaceDto: UpdateWorkspaceDto, userId: string) {
        const workspace = await this.prisma.workspace.findUnique({ where: { id } });
        if (!workspace) throw new NotFoundException('Workspace not found');

        // Only OWNER or ADMIN can update
        const member = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId: id, userId } },
        });
        if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
            throw new ForbiddenException('Insufficient permissions to update workspace');
        }

        return this.prisma.workspace.update({
            where: { id },
            data: updateWorkspaceDto,
        });
    }

    async remove(id: string, userId: string) {
        const workspace = await this.prisma.workspace.findUnique({ where: { id } });
        if (!workspace) throw new NotFoundException('Workspace not found');

        // Only OWNER can delete
        if (workspace.ownerId !== userId) {
            throw new ForbiddenException('Only the workspace owner can delete it');
        }

        return this.prisma.workspace.delete({ where: { id } });
    }

    async createInvite(workspaceId: string, userId: string) {
        // Verify user is OWNER or ADMIN
        const member = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
        });
        if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
            throw new ForbiddenException('Only owners and admins can create invite links');
        }

        const invite = await this.prisma.workspaceInvite.create({
            data: {
                workspaceId: workspaceId,
                createdBy: userId,
            },
        });

        return invite;
    }

    async getInvite(token: string) {
        const invite = await this.prisma.workspaceInvite.findUnique({
            where: { token },
            include: { workspace: true },
        });

        if (!invite) {
            throw new NotFoundException('Invite not found or expired');
        }

        return invite;
    }

    async acceptInvite(token: string, userId: string) {
        const invite = await this.prisma.workspaceInvite.findUnique({
            where: { token },
            include: { workspace: true },
        });

        if (!invite) {
            throw new NotFoundException('Invite not found or expired');
        }

        // Check if already a member
        const existingMember = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId } },
        });

        if (existingMember) {
            return { workspace: invite.workspace, alreadyMember: true };
        }

        // Add as member
        await this.prisma.workspaceMember.create({
            data: {
                workspaceId: invite.workspaceId,
                userId,
                role: 'MEMBER',
            },
        });

        // Increment use count
        await this.prisma.workspaceInvite.update({
            where: { token },
            data: { useCount: { increment: 1 } },
        });

        // Mark any matching email invitations as ACCEPTED
        const user = await this.prisma.user.findUnique({ where: { supabaseId: userId } });
        if (user?.email) {
            await this.prisma.emailInvitation.updateMany({
                where: {
                    workspaceId: invite.workspaceId,
                    email: user.email.toLowerCase(),
                    status: 'PENDING',
                },
                data: {
                    status: 'ACCEPTED',
                    acceptedAt: new Date(),
                },
            });
        }

        return { workspace: invite.workspace, alreadyMember: false };
    }

    async inviteByEmail(
        workspaceId: string,
        userId: string,
        emails: string[],
        channelIds?: string[],
    ) {
        // Verify user is OWNER or ADMIN
        const member = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
            include: { user: true },
        });
        if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
            throw new ForbiddenException('Only owners and admins can send invites');
        }

        // Get workspace name
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
        });
        if (!workspace) {
            throw new NotFoundException('Workspace not found');
        }

        // If channelIds provided, verify they belong to this workspace
        let validChannelIds = channelIds;
        if (validChannelIds?.length) {
            const channels = await this.prisma.channel.findMany({
                where: { id: { in: validChannelIds }, workspaceId },
                select: { id: true },
            });
            const validIds = new Set(channels.map((c) => c.id));
            validChannelIds = validChannelIds.filter((id) => validIds.has(id));
        }

        // Create one invite token for this batch
        const invite = await this.prisma.workspaceInvite.create({
            data: {
                workspaceId,
                createdBy: userId,
            },
        });

        const inviterName =
            member.user?.firstName && member.user?.lastName
                ? `${member.user.firstName} ${member.user.lastName}`
                : member.user?.email || 'A teammate';

        // Create EmailInvitation tracking records FIRST (so DB issues surface before sending)
        const normalizedEmails = emails.map((e) => e.toLowerCase());
        await this.prisma.emailInvitation.createMany({
            data: normalizedEmails.map((email) => ({
                workspaceId,
                email,
                invitedBy: userId,
                inviteToken: invite.token,
                status: 'PENDING',
                channelIds: validChannelIds || [],
            })),
        });

        // Send emails in parallel
        const results = await Promise.allSettled(
            normalizedEmails.map((email) =>
                this.emailService.sendWorkspaceInvite({
                    to: email,
                    workspaceName: workspace.name,
                    inviterName,
                    inviteToken: invite.token,
                }),
            ),
        );

        const sent: string[] = [];
        const failed: string[] = [];

        results.forEach((result, i) => {
            if (result.status === 'fulfilled' && result.value.success) {
                sent.push(normalizedEmails[i]);
            } else {
                failed.push(normalizedEmails[i]);
                const reason = result.status === 'rejected' ? result.reason : result.value.error;
                this.logger.warn(`Failed to send invite to ${normalizedEmails[i]}: ${reason}`);
            }
        });

        // Mark failed sends so tracking stays accurate
        if (failed.length > 0) {
            await this.prisma.emailInvitation.updateMany({
                where: {
                    inviteToken: invite.token,
                    email: { in: failed },
                },
                data: { status: 'FAILED' },
            });
        }

        return {
            inviteToken: invite.token,
            sent,
            failed,
            channelIds: validChannelIds || [],
        };
    }

    async getInvitations(workspaceId: string, userId: string) {
        // Verify membership
        const member = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
        });
        if (!member) {
            throw new ForbiddenException('Not a member of this workspace');
        }

        // Get user email for received invitations
        const user = await this.prisma.user.findUnique({ where: { supabaseId: userId } });

        // Invitations SENT by this user
        const sent = await this.prisma.emailInvitation.findMany({
            where: { workspaceId, invitedBy: userId },
            orderBy: { sentAt: 'desc' },
            include: { workspace: { select: { name: true, slug: true } } },
        });

        // Invitations RECEIVED by this user's email
        const received = user?.email
            ? await this.prisma.emailInvitation.findMany({
                  where: { email: user.email.toLowerCase(), workspaceId },
                  orderBy: { sentAt: 'desc' },
                  include: { workspace: { select: { name: true, slug: true } } },
              })
            : [];

        return { sent, received };
    }
}
