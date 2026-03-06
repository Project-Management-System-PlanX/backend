import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Enabling realtime for 'messages' table...");
        await prisma.$executeRawUnsafe(`begin; drop publication if exists supabase_realtime; create publication supabase_realtime; commit; alter publication supabase_realtime add table messages;`);
        console.log("Enabled realtime successfully.");
    } catch (e) {
        console.error("Error setting up realtime:", e.message);
        try {
            console.log("Trying alternative syntax...");
            await prisma.$executeRawUnsafe(`alter publication supabase_realtime add table "messages"`);
            console.log("Enabled successfully with alternative syntax.");
        } catch (e2) {
            console.error("Error with alternative:", e2.message);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
