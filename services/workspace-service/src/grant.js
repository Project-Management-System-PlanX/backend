const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Granting usage permissions to public schema...");

    await prisma.$executeRawUnsafe(`
    GRANT USAGE ON SCHEMA public TO anon, authenticated;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
    
    -- Ensuring message realtime trigger
    DROP PUBLICATION IF EXISTS supabase_realtime;
    CREATE PUBLICATION supabase_realtime FOR TABLE messages, users;
  `);

    console.log("Successfully granted permissions!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
