import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const workspaces = await prisma.workspace.findMany({ include: { members: true, spaces: true } });
  console.log(JSON.stringify(workspaces, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
