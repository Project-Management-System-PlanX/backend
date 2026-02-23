import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthUser {
    userId: string;
    sessionId: string;
}

/**
 * Parameter decorator to extract the authenticated Clerk user from the request.
 * Usage: @CurrentUser() user: AuthUser
 * Usage: @CurrentUser('userId') userId: string
 */
export const CurrentUser = createParamDecorator(
    (field: keyof AuthUser | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<Request & { auth: AuthUser }>();
        const auth = request.auth;
        if (!auth) return null;
        return field ? auth[field] : auth;
    },
);
