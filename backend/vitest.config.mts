import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    hookTimeout: 180_000,
    testTimeout: 30_000,
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://placeholder/overridden-by-tests',
      JWT_SECRET: 'test-secret-test-secret-test-secret-123456',
      CORS_ORIGIN: 'http://localhost:3000',
    },
  },
});
