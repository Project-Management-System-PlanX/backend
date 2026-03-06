import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const channelId = "078eb176-ff67-422f-ae22-1d54be89679f"; // A fake channel ID or valid?

    // Actually, I can just query the first channel and user
    const channel = await prisma.channel.findFirst();
    const user = await prisma.user.findFirst();

    if (!channel || !user) {
        console.log("No channel or user found.");
        return;
    }

    console.log(`Inserting message into channel ${channel.id} for user ${user.id}...`);
    const msg = await prisma.message.create({
        data: {
            id: "test-realtime-msg-" + Date.now(),
            channelId: channel.id,
            userId: user.supabaseId,
            content: "Hello from test script!",
            updatedAt: new Date()
        }
    });
    console.log("Message inserted:", msg.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
