import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from '../users/users.service';

export interface AuthUser {
    userId: string;
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

    constructor(
        private readonly usersService: UsersService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        
        let userId = 'mock_user_123';
        if (request.headers['x-user-id']) {
            userId = Array.isArray(request.headers['x-user-id']) 
                ? request.headers['x-user-id'][0] 
                : request.headers['x-user-id'];
        }

        const authUser: AuthUser = {
            userId,
            sessionId: 'mock_session',
            email: 'mock@example.com',
            firstName: 'Mock',
            lastName: 'User',
            username: 'mockuser',
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

        return true;
    }
}
