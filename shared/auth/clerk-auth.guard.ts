import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
    private readonly logger = new Logger(ClerkAuthGuard.name);

    constructor(private readonly configService: ConfigService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();

        let userId = 'mock_user_123';
        if (request.headers['x-user-id']) {
            userId = Array.isArray(request.headers['x-user-id'])
                ? request.headers['x-user-id'][0]
                : request.headers['x-user-id'];
        }

        // Attach auth info to request for use in controllers
        (request as Request & { auth: { userId: string; sessionId: string } }).auth = {
            userId,
            sessionId: 'mock_session',
        };

        this.logger.debug(`Authenticated user: ${userId}`);
        return true;
    }
}
