import { spawn } from 'node:child_process';
const children = [];
const specs = [
  ['daemon'],
  ['--filter', '@jevis/desktop', 'dev'],
  ['--filter', '@jevis/web', 'dev'],
  ['--filter', '@jevis/mobile', 'dev'],
];
for (const args of specs)
  children.push(spawn('pnpm', args, { stdio: 'inherit', shell: process.platform === 'win32' }));
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const c of children) c.kill('SIGTERM');
  process.exitCode = code;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
for (const c of children)
  c.on('exit', (code) => {
    if (!stopping) stop(code ?? 1);
  });
