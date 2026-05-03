import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    try {
        console.log('Testing connection...');
        const result = await prisma.$queryRaw`SELECT 1 as result`;
        console.log('Connection successful:', result);
    } catch (err) {
        console.error('Connection failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
