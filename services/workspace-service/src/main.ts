import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

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
    httpAdapter.get('/', (_req: unknown, res: { json: (body: unknown) => void }) => {
        res.json({ status: 'ok', service: 'project-service' });
    });

    const port = process.env.PORT || 3002;
    await app.listen(port);

    console.log(`🚀 Project Service running on http://localhost:${port}`);
}

bootstrap();
