import { mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { Store } from '../../../packages/storage/src/index';
import { configSchema } from '../../../packages/config/src/index';
import { createApi } from './server';
const config = configSchema.parse({
  host: process.env.JEVIS_HOST,
  port: process.env.JEVIS_PORT,
  dataDir: resolve(process.env.JEVIS_DATA_DIR ?? '.jevis'),
});
mkdirSync(config.dataDir, { recursive: true, mode: 0o700 });
const tokenFile = join(config.dataDir, 'token');
let token = process.env.JEVIS_TOKEN;
if (!token) {
  try {
    token = readFileSync(tokenFile, 'utf8').trim();
  } catch {
    token = randomBytes(32).toString('hex');
    writeFileSync(tokenFile, token, { mode: 0o600, flag: 'wx' });
  }
}
chmodSync(config.dataDir, 0o700);
const store = new Store(join(config.dataDir, 'jevis.sqlite'));
const server = createApi(store, token);
server.listen(config.port, config.host, () =>
  console.log(
    'Jevis daemon http://' +
      config.host +
      ':' +
      config.port +
      ' · demo mode\nLocal token: ' +
      (process.env.JEVIS_TOKEN ? 'JEVIS_TOKEN environment variable' : tokenFile),
  ),
);
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  server.closeAllConnections();
  server.close(() => {
    store.close();
    process.exit(0);
  });
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
server.on('error', (e) => {
  console.error(e.message);
  store.close();
  process.exitCode = 1;
});
