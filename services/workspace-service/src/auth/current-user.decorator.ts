import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from './supabase-auth.guard';

/** Platform-agnostic request shape (works with Express and Fastify) */
interface HttpRequest {
    auth?: AuthUser;
    [key: string]: unknown;
}

/**
 * Parameter decorator to extract the authenticated Supabase user from the request.
 *
 * Usage:
 *   @CurrentUser() user: AuthUser              — full auth object
 *   @CurrentUser('userId') userId: string      — just the userId
 */
export const CurrentUser = createParamDecorator(
    (field: keyof AuthUser | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<HttpRequest>();
        const auth = request.auth;
        if (!auth) return null;
        return field ? auth[field] : auth;
    },
);
