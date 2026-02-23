import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface ClerkUserData {
    clerkId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    imageUrl?: string;
}

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    /**
     * Upsert a user from Clerk JWT claims.
     * Called automatically on every authenticated request by the auth guard.
     */
    async upsertFromClerk(data: ClerkUserData) {
        return this.prisma.user.upsert({
            where: { clerkId: data.clerkId },
            create: {
                clerkId: data.clerkId,
                email: data.email,
                firstName: data.firstName ?? null,
                lastName: data.lastName ?? null,
                username: data.username ?? null,
                imageUrl: data.imageUrl ?? null,
            },
            update: {
                email: data.email,
                firstName: data.firstName ?? null,
                lastName: data.lastName ?? null,
                username: data.username ?? null,
                imageUrl: data.imageUrl ?? null,
            },
        });
    }

    /**
     * Get my profile by Clerk ID.
     */
    async getMe(clerkId: string) {
        return this.prisma.user.findUnique({
            where: { clerkId },
        });
    }

    /**
     * Get a user by their Clerk ID (used internally across other services).
     */
    async findByClerkId(clerkId: string) {
        return this.prisma.user.findUnique({
            where: { clerkId },
        });
    }
}
