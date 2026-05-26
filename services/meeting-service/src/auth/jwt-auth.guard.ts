import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

/** Platform-agnostic request shape (works with Express and Fastify) */
interface HttpRequest {
    headers: { authorization?: string; [key: string]: unknown };
    [key: string]: unknown;
}

export interface AuthenticatedUser {
    userId: string;
    email: string;
}

export interface AuthenticatedRequest extends HttpRequest {
    user: AuthenticatedUser;
}

/**
 * Simple JWT Auth Guard
 * Extracts user info from the Authorization header
 *
 * For Supabase Auth: The JWT payload contains user info
 * For other auth providers: Adjust the token parsing as needed
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const authHeader = request.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedException('Missing authorization header');
        }

        const token = authHeader.replace('Bearer ', '');

        if (!token) {
            throw new UnauthorizedException('Missing token');
        }

        try {
            // Decode the JWT payload (Supabase JWT contains user info)
            const payload = this.decodeJwt(token);

            if (!payload || !payload.sub) {
                throw new UnauthorizedException('Invalid token');
            }

            request.user = {
                userId: payload.sub as string,
                email: (payload.email as string) || '',
            };

            return true;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException('Token validation failed');
        }
    }

    private decodeJwt(
        token: string,
    ): { sub?: string; email?: string; [key: string]: unknown } | null {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                return null;
            }
            const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
            return JSON.parse(payload);
        } catch {
            return null;
        }
    }
}
