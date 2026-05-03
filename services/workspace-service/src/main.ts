import fastifyCompress from '@fastify/compress';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

    // Register fastify-compress for response compression
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await app.register(fastifyCompress as any, { global: true });

    // Enable CORS
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    });

    // Enable validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Root health-check — prevents 404 on GET /
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get('/', (_req: unknown, reply: { send: (body: unknown) => void }) => {
        reply.send({ status: 'ok', service: 'workspace-service' });
    });

    const port = process.env.PORT || 3002;
    await app.listen(port, '0.0.0.0');

    console.log(`Workspace Service running on http://localhost:${port}`);
}

bootstrap();
