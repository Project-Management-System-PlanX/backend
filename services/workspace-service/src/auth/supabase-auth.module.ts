import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '../users/users.module';
import { SupabaseAuthGuard } from './supabase-auth.guard';

/**
 * Global Supabase auth module. Import once in AppModule.
 * Provides SupabaseAuthGuard as APP_GUARD (protects all routes).
 * Imports UsersModule so UsersService can be injected into the guard for auto-sync.
 */
@Global()
@Module({
    imports: [UsersModule],
    providers: [
        SupabaseAuthGuard,
        {
            provide: APP_GUARD,
            useClass: SupabaseAuthGuard,
        },
    ],
    exports: [SupabaseAuthGuard],
})
export class SupabaseAuthModule {}
