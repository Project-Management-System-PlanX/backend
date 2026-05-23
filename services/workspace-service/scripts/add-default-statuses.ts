import { PrismaClient } from '@prisma/client';
import { addDefaultStatusesToAllSpaces } from '../src/migrations/add-default-statuses';

const prisma = new PrismaClient();

async function main() {
	try {
		console.log('🚀 Running migration script...\n');
		const result = await addDefaultStatusesToAllSpaces(prisma as any);
		console.log(`\n✅ Migration complete! Updated ${result.spacesUpdated} space(s).`);
	} catch (error) {
		console.error('Error running migration:', error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main();
