import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
            transactionOptions: {
                maxWait: 10000,  // 10s max wait to acquire a connection
                timeout: 15000,  // 15s max transaction duration
            },
        });
    }

    async onModuleInit() {
        const maxRetries = 5;
        const retryDelay = 3000; // 3 seconds

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.$connect();
                this.logger.log('Connected to database');
                return;
            } catch (err) {
                if (attempt === maxRetries) {
                    this.logger.error(`Failed to connect to database after ${maxRetries} attempts`);
                    throw err;
                }
                this.logger.warn(
                    `Database connection attempt ${attempt}/${maxRetries} failed. Retrying in ${retryDelay / 1000}s...`,
                );
                await new Promise((resolve) => setTimeout(resolve, retryDelay));
            }
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('Disconnected from database');
    }
}
