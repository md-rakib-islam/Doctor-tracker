/**
 * Creates (or, with --reset, resets the password of) an administrator.
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='long-password' npm run admin:create
 * Credentials come from the environment/.env only - nothing is hard-coded or shipped by default.
 */
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { connectDb, disconnectDb } from '../config/db';
import { env } from '../config/env';
import { Admin } from '../models/Admin';
import { BCRYPT_ROUNDS, createAdmin } from '../services/auth.service';
import { logger } from '../utils/logger';

const input = z.object({
  name: z.string().trim().min(2).default('Administrator'),
  email: z.string().trim().toLowerCase().pipe(z.email('ADMIN_EMAIL must be a valid email')),
  password: z.string().min(10, 'ADMIN_PASSWORD must be at least 10 characters'),
});

async function main() {
  const parsed = input.safeParse({
    name: process.env.ADMIN_NAME || undefined,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  if (!parsed.success) {
    logger.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 10 chars) in the environment or backend/.env');
    parsed.error.issues.forEach((i) => logger.error(`  - ${i.path.join('.')}: ${i.message}`));
    process.exit(1);
  }

  await connectDb(env.MONGODB_URI);
  const existing = await Admin.exists({ email: parsed.data.email });
  if (existing && !process.argv.includes('--reset')) {
    logger.warn(`Admin ${parsed.data.email} already exists. Re-run with --reset to change the password.`);
  } else if (existing) {
    const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);
    await Admin.updateOne({ email: parsed.data.email }, { $set: { passwordHash, name: parsed.data.name } });
    logger.info(`Password reset for ${parsed.data.email}`);
  } else {
    await createAdmin(parsed.data);
    logger.info(`Admin created: ${parsed.data.email}`);
  }
  await disconnectDb();
}

main().catch((e) => {
  logger.error('createAdmin failed', e);
  process.exit(1);
});
