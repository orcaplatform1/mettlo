import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'prisma/config';

// Bağlantı adresi projenin kökündeki .env dosyasındaki DATABASE_URL'den okunur.
const envPath = join(__dirname, '..', '..', '.env');
if (existsSync(envPath)) process.loadEnvFile(envPath);

export default defineConfig({
  schema: '../../database/prisma/schema',
  migrations: {
    path: '../../database/prisma/schema/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
