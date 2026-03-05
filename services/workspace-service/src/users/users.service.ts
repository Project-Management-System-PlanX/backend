import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SupabaseUserData {
    supabaseId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    imageUrl?: string;
}

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Upsert a user from Supabase JWT claims.
     * Called automatically on every authenticated request by the auth guard.
     */
    async upsertFromSupabase(data: SupabaseUserData) {
        return this.prisma.users.upsert({
            where: { supabaseId: data.supabaseId },
            create: {
                supabaseId: data.supabaseId,
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
     * Get my profile by Supabase ID.
     */
    async getMe(supabaseId: string) {
        return this.prisma.users.findUnique({
            where: { supabaseId },
        });
    }

    /**
     * Get a user by their Supabase ID (used internally across other services).
     */
    async findBySupabaseId(supabaseId: string) {
        return this.prisma.users.findUnique({
            where: { supabaseId },
        });
    }
}
