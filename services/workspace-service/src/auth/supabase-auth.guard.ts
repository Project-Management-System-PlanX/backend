import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UsersService } from '../users/users.service';
import { IS_PUBLIC_KEY } from './public.decorator';

/** Platform-agnostic request shape (works with Express and Fastify) */
interface HttpRequest {
    headers: { authorization?: string; [key: string]: unknown };
    [key: string]: unknown;
}

export interface AuthUser {
    userId: string; // Supabase user ID (auth.users.id)
    email: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    imageUrl?: string;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
    private readonly logger = new Logger(SupabaseAuthGuard.name);
    private readonly supabase: SupabaseClient;

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly reflector: Reflector,
    ) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be configured');
        }

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Skip auth for routes decorated with @Public()
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const request = context.switchToHttp().getRequest<HttpRequest>();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid Authorization header');
        }

        const token = authHeader.slice(7);

        try {
            const {
                data: { user },
                error,
            } = await this.supabase.auth.getUser(token);

            if (error || !user) {
                throw new Error(error?.message || 'Invalid user');
            }

            // Extract user profile claims from Supabase user_metadata
            const metadata = user.user_metadata || {};
            const identityData = user.identities?.[0]?.identity_data || {};

            const authUser: AuthUser = {
                userId: user.id,
                email: user.email || '',
                firstName:
                    metadata.first_name ||
                    metadata.full_name?.split(' ')[0] ||
                    identityData.first_name ||
                    identityData.full_name?.split(' ')[0],
                lastName:
                    metadata.last_name ||
                    metadata.full_name?.split(' ').slice(1).join(' ') ||
                    identityData.last_name ||
                    identityData.full_name?.split(' ').slice(1).join(' '),
                username:
                    metadata.username || identityData.user_name || identityData.preferred_username,
                imageUrl:
                    metadata.avatar_url ||
                    metadata.picture ||
                    identityData.avatar_url ||
                    identityData.picture,
            };

            // Attach to request for @CurrentUser() decorator
            (request as unknown as { auth: AuthUser }).auth = authUser;

            // Auto-sync user to our DB (upsert) — fire and forget, non-blocking
            if (authUser.email) {
                this.usersService
                    .upsertFromSupabase({
                        supabaseId: authUser.userId,
                        email: authUser.email,
                        firstName: authUser.firstName,
                        lastName: authUser.lastName,
                        username: authUser.username,
                        imageUrl: authUser.imageUrl,
                    })
                    .catch((err) =>
                        this.logger.warn(`User sync failed for ${authUser.userId}: ${err.message}`),
                    );
            }

            this.logger.debug(`Authenticated: ${authUser.userId} (${authUser.email})`);
            return true;
        } catch (error) {
            this.logger.warn(`Token verification failed: ${(error as Error).message}`);
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
