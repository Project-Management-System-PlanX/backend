import { PrismaService } from '../prisma/prisma.service';

const defaultStatuses = [
	{ name: 'Today', color: '#A16207', position: 0, isDone: false },
	{ name: 'This Week', color: '#166534', position: 1, isDone: false },
	{ name: 'Later', color: '#111111', position: 2, isDone: false },
];

export async function addDefaultStatusesToAllSpaces(prisma: PrismaService) {
	try {
		console.log('Starting migration: Adding default statuses to spaces...');

		// Get all spaces
		const spaces = await prisma.space.findMany({
			include: { statuses: true },
		});

		console.log(`Found ${spaces.length} spaces`);

		for (const space of spaces) {
			// Check if space already has statuses
			if (space.statuses.length > 0) {
				console.log(`✓ Space "${space.name}" already has statuses, skipping...`);
				continue;
			}

			console.log(`→ Adding default statuses to space "${space.name}"...`);

			// Create default statuses for this space
			await prisma.taskStatus.createMany({
				data: defaultStatuses.map((status) => ({
					...status,
					spaceId: space.id,
				})),
			});

			console.log(`✓ Added default statuses to space "${space.name}"`);
		}

		console.log('✓ Migration completed successfully!');
		return { success: true, spacesUpdated: spaces.filter((s) => s.statuses.length === 0).length };
	} catch (error) {
		console.error('❌ Migration failed:', error);
		throw error;
	}
}
