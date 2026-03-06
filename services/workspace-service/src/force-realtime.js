const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Completely disabling RLS on messages so Supabase broadcasts everything unconditionally...");

    await prisma.$executeRawUnsafe(`
    -- 1. Disable RLS entirely on the tables we want realtime for
    ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
    ALTER TABLE users DISABLE ROW LEVEL SECURITY;
    
    -- 2. Ensure Replica Identity is FULL so the whole row payload is sent over the websocket
    ALTER TABLE messages REPLICA IDENTITY FULL;
    ALTER TABLE users REPLICA IDENTITY FULL;
  `);

    console.log("Successfully removed all RLS restrictions on messages!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
