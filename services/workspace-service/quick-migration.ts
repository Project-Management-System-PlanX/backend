import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	console.log('🚀 Adding default statuses to all spaces...\n');

	const defaultStatuses = [
		{ name: 'Today', color: '#A16207', position: 0, isDone: false },
		{ name: 'This Week', color: '#166534', position: 1, isDone: false },
		{ name: 'Later', color: '#111111', position: 2, isDone: false },
	];

	// Get all spaces
	const allSpaces = await prisma.space.findMany({
		include: { statuses: true },
	});

	console.log(`Found ${allSpaces.length} space(s)\n`);

	let updatedCount = 0;

	for (const space of allSpaces) {
		console.log(`Checking space: "${space.name}"`);
		console.log(`  Current statuses: ${space.statuses.map((s) => s.name).join(', ') || 'None'}`);

		// Check which default statuses are missing
		const missingStatuses = defaultStatuses.filter(
			(defaultStatus) => !space.statuses.some((s) => s.name === defaultStatus.name)
		);

		if (missingStatuses.length > 0) {
			console.log(`  Adding ${missingStatuses.length} missing status(es)...`);

			for (const status of missingStatuses) {
				await prisma.taskStatus.create({
					data: {
						...status,
						spaceId: space.id,
					},
				});
			}
			updatedCount++;
			console.log(`  ✓ Updated!\n`);
		} else {
			console.log(`  ✓ Already has all default statuses\n`);
		}
	}

	console.log(`\n✅ Done! Updated ${updatedCount} space(s) out of ${allSpaces.length}`);
	process.exit(0);
}

main().catch((err) => {
	console.error('❌ Error:', err);
	process.exit(1);
});
