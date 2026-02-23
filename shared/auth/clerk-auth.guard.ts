import { Clerk } from '@clerk/backend';
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
    private readonly logger = new Logger(ClerkAuthGuard.name);
    private readonly clerk: ReturnType<typeof Clerk>;

    constructor(private readonly configService: ConfigService) {
        const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
        if (!secretKey) {
            throw new Error('CLERK_SECRET_KEY is not configured');
        }
        this.clerk = Clerk({ secretKey });
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid Authorization header');
        }

        const token = authHeader.slice(7);

        try {
            const payload = await this.clerk.verifyToken(token);

            // Attach auth info to request for use in controllers
            (request as Request & { auth: { userId: string; sessionId: string } }).auth = {
                userId: payload.sub,
                sessionId: (payload.sid as string) ?? '',
            };

            this.logger.debug(`Authenticated user: ${payload.sub}`);
            return true;
        } catch (error) {
            this.logger.warn(`Token verification failed: ${(error as Error).message}`);
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
