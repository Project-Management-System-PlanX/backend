import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);

    try {
        const result = await prisma.$queryRawUnsafe(`
      SELECT tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime';
    `);
        console.log("Tables in supabase_realtime publication:", result);

        const policies = await prisma.$queryRawUnsafe(`
      SELECT policyname, tablename, permissive, roles, cmd, qual 
      FROM pg_policies 
      WHERE tablename = 'messages';
    `);
        console.log("Policies on messages:", policies);
    } catch (e) {
        console.error("Error:", e);
    }

    await app.close();
}

bootstrap();
