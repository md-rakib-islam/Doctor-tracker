/**
 * Zero-install local MongoDB for development (no Docker / Homebrew needed).
 * Starts a real mongod on 127.0.0.1:27017 with data persisted in backend/.mongo-data.
 */
import fs from 'node:fs';
import path from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';

async function main() {
  const dbPath = path.resolve(__dirname, '../../.mongo-data');
  fs.mkdirSync(dbPath, { recursive: true });
  const server = await MongoMemoryServer.create({
    instance: { port: 27017, ip: '127.0.0.1', dbPath, storageEngine: 'wiredTiger' },
  });
  console.log(`MongoDB ready: ${server.getUri()}doctor-tracker  (data: ${dbPath})`);
  const stop = async () => {
    await server.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
