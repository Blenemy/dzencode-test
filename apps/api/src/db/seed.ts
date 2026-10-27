import { hash } from '@node-rs/argon2';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { disconnectDb, prisma } from '../lib/prisma.js';

async function seedDemoUser(): Promise<void> {
  const passwordHash = await hash(env.DEMO_PASSWORD);

  await prisma.user.upsert({
    where: { email: env.DEMO_EMAIL },
    update: { passwordHash, isActive: true },
    create: { email: env.DEMO_EMAIL, name: 'Демо Пользователь', passwordHash },
  });

  logger.info({ email: env.DEMO_EMAIL }, 'demo user is ready');
}

try {
  await seedDemoUser();
} catch (err) {
  logger.error({ err }, 'seed failed');
  process.exitCode = 1;
} finally {
  await disconnectDb();
}
