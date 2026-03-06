const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const result = await prisma.$queryRawUnsafe(`
    SELECT tablename 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime';
  `);
    console.log("Tables in supabase_realtime publication:", result);
}

main().catch(console.error).finally(() => prisma.$disconnect());
