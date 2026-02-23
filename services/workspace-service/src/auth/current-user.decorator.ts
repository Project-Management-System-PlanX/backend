import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from './clerk-auth.guard';

/**
 * Parameter decorator to extract the authenticated Clerk user from the request.
 *
 * Usage:
 *   @CurrentUser() user: AuthUser              — full auth object
 *   @CurrentUser('userId') userId: string      — just the userId
 */
export const CurrentUser = createParamDecorator(
    (field: keyof AuthUser | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<Request & { auth: AuthUser }>();
        const auth = request.auth;
        if (!auth) return null;
        return field ? auth[field] : auth;
    },
);
