import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Cleaning up 'Done' columns...");

    // Find all 'Done' columns
    const doneStatuses = await prisma.taskStatus.findMany({
        where: { name: 'Done' },
    });

    for (const status of doneStatuses) {
        console.log(`Found 'Done' status in space ${status.spaceId}`);

        // Find another status in the same space to move tasks to
        const fallbackStatus = await prisma.taskStatus.findFirst({
            where: {
                spaceId: status.spaceId,
                id: { not: status.id },
            },
            orderBy: { position: 'asc' },
        });

        if (fallbackStatus) {
            // Move tasks to fallback status
            const updateCount = await prisma.task.updateMany({
                where: { statusId: status.id },
                data: { statusId: fallbackStatus.id },
            });
            console.log(`Moved ${updateCount.count} tasks to '${fallbackStatus.name}'`);
        }

        // Delete the Done status
        await prisma.taskStatus.delete({
            where: { id: status.id },
        });
        console.log(`Deleted 'Done' status ${status.id}`);
    }

    console.log('Cleanup complete!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
