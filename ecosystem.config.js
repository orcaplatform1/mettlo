// Mettlo süreçleri: 'mettlo' kullanıcısının PM2'si ile çalışır (root'un PM2'sindeki diğer sitelerden ayrı).
const fs = require('fs');
const path = require('path');
const root = __dirname;
const env = {};
try {
  for (const line of fs.readFileSync(path.join(root, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2];
  }
} catch {}
const shared = { NODE_ENV: 'production', INTERNAL_API_URL: 'http://127.0.0.1:3301/v1', APP_URL: env.APP_URL, REVALIDATE_SECRET: env.REVALIDATE_SECRET, INTERNAL_API_KEY: env.INTERNAL_API_KEY, NEXT_TELEMETRY_DISABLED: '1' };
const next = (name, dir, port) => ({
  name, cwd: path.join(root, dir), script: 'node_modules/next/dist/bin/next', args: `start -H 127.0.0.1 -p ${port}`,
  env: { ...shared, PORT: String(port) }, max_memory_restart: '700M', autorestart: true, time: true,
});
module.exports = {
  apps: [
    { name: 'mettlo-api', cwd: path.join(root, 'services/api'), script: 'dist/main.js', env: { ...env, NODE_ENV: 'production' }, max_memory_restart: '600M', autorestart: true, time: true },
    next('mettlo-member-web', 'apps/member-web', 3300),
    next('mettlo-creator-web', 'apps/creator-web', 3302),
    next('mettlo-admin-web', 'apps/admin-web', 3303),
  ],
};
