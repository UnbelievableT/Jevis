import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const run = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const dir = path.join(root, 'deps');
const manifest = JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf8'));
const git = async (cwd, ...args) =>
  (
    await run('git', ['-c', 'core.hooksPath=/dev/null', ...args], {
      cwd,
      maxBuffer: 8 * 1024 * 1024,
    })
  ).stdout.trim();
let previous = { repositories: [] };
try {
  previous = JSON.parse(await readFile(path.join(dir, 'lock.json'), 'utf8'));
} catch {}
const mode = process.argv[2] ?? 'verify';
if (!['fetch', 'verify'].includes(mode)) throw new Error('Expected fetch or verify');
const queue = [...manifest.repositories],
  results = [],
  errors = [];
async function worker() {
  for (;;) {
    const repo = queue.shift();
    if (!repo) break;
    const cwd = path.join(dir, repo.name);
    try {
      let exists = true;
      try {
        await access(path.join(cwd, '.git'));
      } catch {
        exists = false;
      }
      if (!exists && mode === 'verify') throw new Error('checkout missing');
      if (!exists) {
        console.log('Cloning ' + repo.name);
        await git(dir, 'clone', '--depth=1', '--single-branch', '--', repo.url, cwd);
        const locked = previous.repositories.find((r) => r.name === repo.name);
        if (locked && (await git(cwd, 'rev-parse', 'HEAD')) !== locked.sha) {
          await git(cwd, 'fetch', '--depth=1', 'origin', locked.sha);
          await git(cwd, 'checkout', '--detach', locked.sha);
        }
      }
      const sha = await git(cwd, 'rev-parse', 'HEAD');
      const origin = await git(cwd, 'remote', 'get-url', 'origin');
      if (origin !== repo.url) throw new Error('origin differs from manifest');
      const branch = await git(cwd, 'symbolic-ref', '--short', 'HEAD').catch(() => 'detached');
      const licenseFiles = (await git(cwd, 'ls-files'))
        .split('\n')
        .filter((p) => /(^|\/)(licen[sc]e|notice|copying)(\.|$)/i.test(p));
      const dirty = await git(cwd, 'status', '--porcelain', '--untracked-files=no');
      const expected = previous.repositories.find((r) => r.name === repo.name);
      if (dirty) throw new Error('tracked local modifications; preserved');
      if (expected && expected.sha !== sha)
        throw new Error('SHA differs from lock; preserved, review update explicitly');
      results.push({ ...repo, sha, branch, licenseFiles });
      console.log('OK ' + repo.name + ' ' + sha.slice(0, 12));
    } catch (e) {
      errors.push(repo.name + ': ' + e.message);
      console.error(errors.at(-1));
    }
  }
}
await mkdir(dir, { recursive: true });
await Promise.all(Array.from({ length: 4 }, worker));
if (mode === 'fetch') {
  const merged = manifest.repositories
    .map(
      (r) =>
        results.find((x) => x.name === r.name) ??
        previous.repositories.find((x) => x.name === r.name),
    )
    .filter(Boolean);
  await writeFile(
    path.join(dir, 'lock.json'),
    JSON.stringify(
      { schemaVersion: 1, capturedAt: new Date().toISOString(), repositories: merged },
      null,
      2,
    ) + '\n',
  );
}
if (errors.length) process.exitCode = 1;
