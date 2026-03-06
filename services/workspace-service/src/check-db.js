const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const workspaces = await prisma.workspace.findMany({ include: { members: { include: { user: true } } } });
    console.log("Workspaces and Members:");
    workspaces.forEach(w => {
        console.log(`\nWorkspace: ${w.name} (${w.id})`);
        w.members.forEach(m => {
            console.log(` - ${m.user?.firstName || m.user?.email || m.userId} (${m.role})`);
        });
    });

    console.log("\nChannels:");
    const channels = await prisma.channel.findMany({ include: { members: true } });
    channels.forEach(c => {
        console.log(`[${c.workspaceId}] Channel: ${c.name} (${c.type})`);
        c.members.forEach(m => {
            console.log(` - Member ID: ${m.userId} (${m.role})`);
        });
    });
}
main().finally(() => prisma.$disconnect());
