// Common types used across services

export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export enum UserRole {
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER',
    GUEST = 'GUEST',
}

export enum ChannelType {
    PUBLIC = 'PUBLIC',
    PRIVATE = 'PRIVATE',
}

export enum TaskStatus {
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    IN_REVIEW = 'IN_REVIEW',
    COMPLETED = 'COMPLETED',
}

export enum TaskPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

export enum MeetingStatus {
    SCHEDULED = 'SCHEDULED',
    ACTIVE = 'ACTIVE',
    ENDED = 'ENDED',
}

export enum MessageType {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    FILE = 'FILE',
    SYSTEM = 'SYSTEM',
}

export enum NotificationType {
    TASK_ASSIGNED = 'TASK_ASSIGNED',
    TASK_OVERDUE = 'TASK_OVERDUE',
    MESSAGE = 'MESSAGE',
    MENTION = 'MENTION',
    MEETING_STARTED = 'MEETING_STARTED',
    MEMBER_JOINED = 'MEMBER_JOINED',
}
