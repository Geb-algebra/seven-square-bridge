import { prisma } from '~/db.server';

export async function resetDB() {
  // execSync('npx prisma migrate reset --force');  // waste too much time
  await prisma.user.deleteMany();
  await prisma.player.deleteMany();
  await prisma.room.deleteMany();
  // add more deleteMany here if needed
}
