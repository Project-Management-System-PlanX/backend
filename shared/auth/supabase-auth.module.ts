import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SupabaseAuthGuard } from './supabase-auth.guard';

/**
 * Global auth module — import once in AppModule.
 * Registers SupabaseAuthGuard as the global guard, protecting all routes by default.
 */
@Global()
@Module({
    providers: [
        SupabaseAuthGuard,
        {
            provide: APP_GUARD,
            useClass: SupabaseAuthGuard,
        },
    ],
    exports: [SupabaseAuthGuard],
})
export class SupabaseAuthModule { }
