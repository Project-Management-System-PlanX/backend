import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ClerkAuthGuard } from './clerk-auth.guard';

/**
 * Global auth module — import once in AppModule.
 * Registers ClerkAuthGuard as the global guard, protecting all routes by default.
 */
@Global()
@Module({
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
