import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client: RedisClientType;
    private publisher: RedisClientType;
    private subscriber: RedisClientType;

    async onModuleInit() {
        const redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
            throw new Error('REDIS_URL is not defined in environment variables');
        }

        // Main client for general operations
        this.client = createClient({ url: redisUrl });
        await this.client.connect();

        // Publisher for Pub/Sub
        this.publisher = createClient({ url: redisUrl });
        await this.publisher.connect();

        // Subscriber for Pub/Sub
        this.subscriber = createClient({ url: redisUrl });
        await this.subscriber.connect();

        console.log('Redis connected');
    }

    async onModuleDestroy() {
        await this.client.quit();
        await this.publisher.quit();
        await this.subscriber.quit();
        console.log('Redis disconnected');
    }

    // General Redis operations
    getClient(): RedisClientType {
        return this.client;
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        if (ttl) {
            await this.client.setEx(key, ttl, value);
        } else {
            await this.client.set(key, value);
        }
    }

    async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    // Pub/Sub operations
    async publish(channel: string, message: string): Promise<void> {
        await this.publisher.publish(channel, message);
    }

    async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
        await this.subscriber.subscribe(channel, callback);
    }

    async unsubscribe(channel: string): Promise<void> {
        await this.subscriber.unsubscribe(channel);
    }

    // Cache helpers
    async cacheSet(key: string, value: unknown, ttl: number = 3600): Promise<void> {
        await this.set(key, JSON.stringify(value), ttl);
    }

    async cacheGet<T>(key: string): Promise<T | null> {
        const value = await this.get(key);
        return value ? JSON.parse(value) : null;
    }

    async cacheDel(key: string): Promise<void> {
        await this.del(key);
    }
}
