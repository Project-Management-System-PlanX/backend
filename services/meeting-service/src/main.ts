import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Enable CORS
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Set global prefix
    app.setGlobalPrefix('api');

    const port = process.env.MEETING_PORT || 3005;
    await app.listen(port, '0.0.0.0');

    console.log(`🚀 Meeting service running on http://localhost:${port}`);
    console.log(`📡 API endpoints available at http://localhost:${port}/api/meetings`);
}

bootstrap();
