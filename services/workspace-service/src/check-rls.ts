import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const result = await prisma.$queryRawUnsafe(`
    SELECT relrowsecurity 
    FROM pg_class 
    WHERE relname = 'messages';
  `);
    console.log("RLS enabled:", result);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
