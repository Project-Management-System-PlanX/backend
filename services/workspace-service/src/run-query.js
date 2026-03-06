import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    await prisma.$executeRawUnsafe(`
    DROP POLICY IF EXISTS "Enable read access for all users" ON messages;
    CREATE POLICY "Enable read access for all users" ON messages FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Enable read access for all users" ON users;
    CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
  `);
    console.log("Made messages and users readable by everyone (including anon).");
}

main().catch(console.error).finally(() => prisma.$disconnect());
