import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
    private readonly logger = new Logger(SupabaseAuthGuard.name);
    private readonly supabase: SupabaseClient;

    constructor(private readonly configService: ConfigService) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are not configured');
        }
        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid Authorization header');
        }

        const token = authHeader.slice(7);

        try {
            const { data: { user }, error } = await this.supabase.auth.getUser(token);

            if (error || !user) {
                throw new Error(error?.message || 'Invalid user');
            }

            // Attach auth info to request for use in controllers
            (request as Request & { auth: { userId: string } }).auth = {
                userId: user.id
            };

            this.logger.debug(`Authenticated user: ${user.id}`);
            return true;
        } catch (error) {
            this.logger.warn(`Token verification failed: ${(error as Error).message}`);
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
