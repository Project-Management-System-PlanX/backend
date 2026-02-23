import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '../users/users.module';
import { ClerkAuthGuard } from './clerk-auth.guard';

/**
 * Global Clerk auth module. Import once in AppModule.
 * Provides ClerkAuthGuard as APP_GUARD (protects all routes).
 * Imports UsersModule so UsersService can be injected into the guard for auto-sync.
 */
@Global()
@Module({
    imports: [UsersModule],
    providers: [
        ClerkAuthGuard,
        {
            provide: APP_GUARD,
            useClass: ClerkAuthGuard,
        },
    ],
    exports: [ClerkAuthGuard],
})
export class ClerkAuthModule {}
