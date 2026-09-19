import { it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { authorize, mayRetry } from '../packages/security/src/index';
import { UnconfiguredRunner } from '../packages/adapters/src/index';
import { UnconfiguredJev } from '../packages/judge/src/index';
it('rejects escaping symlinks and tool execution without a sandbox', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'jevis-policy-'));
  try {
    const root = join(dir, 'project');
    await mkdir(root);
    await writeFile(join(dir, 'outside'), 'secret');
    await symlink(join(dir, 'outside'), join(root, 'link'));
    const policy = {
      root,
      allowed: ['read', 'process'] as ('read' | 'process')[],
      sandboxVerified: false,
    };
    expect((await authorize(policy, 'read', join(root, 'link'))).allowed).toBe(false);
    expect((await authorize(policy, 'process')).allowed).toBe(false);
    expect((await authorize(policy, 'read', root)).allowed).toBe(true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
it('never retries unknown external operations by default', () => {
  expect(mayRetry({ id: 'x', taskId: 't', state: 'unknown', idempotencyKey: 'k' })).toBe(false);
});
it('does not pretend unconfigured adapters are operational', async () => {
  await expect(new UnconfiguredJev().evaluate('state', [])).rejects.toThrow('not connected');
  await expect(new UnconfiguredRunner('codex').cancel('x')).rejects.toThrow('not implemented');
});
