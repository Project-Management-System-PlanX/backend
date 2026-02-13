// Event types for inter-service communication

export enum EventType {
    // Workspace events
    WORKSPACE_CREATED = 'workspace.created',
    WORKSPACE_UPDATED = 'workspace.updated',
    WORKSPACE_DELETED = 'workspace.deleted',

    // Channel events
    CHANNEL_CREATED = 'channel.created',
    CHANNEL_UPDATED = 'channel.updated',
    CHANNEL_DELETED = 'channel.deleted',

    // Member events
    MEMBER_JOINED = 'member.joined',
    MEMBER_LEFT = 'member.left',
    MEMBER_ROLE_UPDATED = 'member.role.updated',

    // Message events
    MESSAGE_SENT = 'message.sent',
    MESSAGE_UPDATED = 'message.updated',
    MESSAGE_DELETED = 'message.deleted',
    MESSAGE_REACTION_ADDED = 'message.reaction.added',
    MESSAGE_REACTION_REMOVED = 'message.reaction.removed',

    // Task events
    TASK_CREATED = 'task.created',
    TASK_UPDATED = 'task.updated',
    TASK_DELETED = 'task.deleted',
    TASK_ASSIGNED = 'task.assigned',
    TASK_COMPLETED = 'task.completed',

    // Meeting events
    MEETING_STARTED = 'meeting.started',
    MEETING_ENDED = 'meeting.ended',
    PARTICIPANT_JOINED = 'participant.joined',
    PARTICIPANT_LEFT = 'participant.left',

    // Notification events
    NOTIFICATION_CREATED = 'notification.created',
}

export interface BaseEvent {
    type: EventType;
    timestamp: Date;
    userId?: string;
    workspaceId?: string;
}

export interface WorkspaceCreatedEvent extends BaseEvent {
    type: EventType.WORKSPACE_CREATED;
    workspaceId: string;
    ownerId: string;
    name: string;
}

export interface ChannelCreatedEvent extends BaseEvent {
    type: EventType.CHANNEL_CREATED;
    channelId: string;
    workspaceId: string;
    name: string;
}

export interface MemberJoinedEvent extends BaseEvent {
    type: EventType.MEMBER_JOINED;
    workspaceId: string;
    userId: string;
    role: string;
}

export interface MessageSentEvent extends BaseEvent {
    type: EventType.MESSAGE_SENT;
    messageId: string;
    channelId?: string;
    groupId?: string;
    senderId: string;
    content: string;
}

export interface TaskCreatedEvent extends BaseEvent {
    type: EventType.TASK_CREATED;
    taskId: string;
    spaceId: string;
    title: string;
    assigneeId?: string;
}

export interface MeetingStartedEvent extends BaseEvent {
    type: EventType.MEETING_STARTED;
    meetingId: string;
    roomId: string;
    title: string;
}

export type Event =
    | WorkspaceCreatedEvent
    | ChannelCreatedEvent
    | MemberJoinedEvent
    | MessageSentEvent
    | TaskCreatedEvent
    | MeetingStartedEvent;
