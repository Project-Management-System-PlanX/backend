import { verifyToken } from '@clerk/backend';
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { UsersService } from '../users/users.service';

export interface AuthUser {
    userId: string; // Clerk user ID (user_xxx)
    sessionId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    imageUrl?: string;
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
    private readonly logger = new Logger(ClerkAuthGuard.name);
    private readonly secretKey: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
    ) {
        const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
        if (!secretKey) {
            throw new Error('CLERK_SECRET_KEY is not configured');
        }
        this.secretKey = secretKey;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid Authorization header');
        }

        const token = authHeader.slice(7);

        try {
            const payload = await verifyToken(token, {
                secretKey: this.secretKey,
            });

            // Extract user profile claims from JWT
            const authUser: AuthUser = {
                userId: payload.sub,
                sessionId: (payload.sid as string) ?? '',
                email: (payload['email'] as string) ?? '',
                firstName: (payload['first_name'] as string) ?? undefined,
                lastName: (payload['last_name'] as string) ?? undefined,
                username: (payload['username'] as string) ?? undefined,
                imageUrl: (payload['image_url'] as string) ?? undefined,
            };

            // Attach to request for @CurrentUser() decorator
            (request as Request & { auth: AuthUser }).auth = authUser;

            // Auto-sync user to our DB (upsert) — fire and forget, non-blocking
            if (authUser.email) {
                this.usersService
                    .upsertFromClerk({
                        clerkId: authUser.userId,
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
