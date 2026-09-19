import { it, expect } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store, ArtifactStore } from '../packages/storage/src/index';
import { createTaskSchema } from '../packages/contracts/src/index';
it('persists task, event and idempotency result across a reopen', () => {
  const dir = mkdtempSync(join(tmpdir(), 'jevis-'));
  const file = join(dir, 'db.sqlite');
  let store = new Store(file);
  try {
    const input = createTaskSchema.parse({ title: 'Durable task', goal: 'Survive restart' });
    const created = store.create(input, 'create-123');
    expect(store.create(input, 'create-123').id).toBe(created.id);
    const command = { action: 'start' as const, expectedRevision: 0 };
    const started = store.command(created.id, command, 'start-123');
    store.close();
    store = new Store(file);
    expect(store.get(created.id).status).toBe('running');
    expect(store.command(created.id, command, 'start-123')).toEqual(started);
    expect(store.events()).toHaveLength(2);
    expect(() =>
      store.command(created.id, { action: 'pause', expectedRevision: 1 }, 'start-123'),
    ).toThrow('Idempotency');
    expect(() =>
      store.command(created.id, { action: 'pause', expectedRevision: 0 }, 'stale-123'),
    ).toThrow('revision');
    expect(store.events()).toHaveLength(2);
    expect(store.events(1)[0].type).toBe('start');
    expect(store.get(created.id).revision).toBe(1);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
it('stores immutable artifacts and rejects corruption and traversal', () => {
  const dir = mkdtempSync(join(tmpdir(), 'jevis-cas-'));
  try {
    const cas = new ArtifactStore(dir),
      ref = cas.put(Buffer.from('evidence'), 'text/plain');
    expect(cas.get(ref).toString()).toBe('evidence');
    expect(cas.put(Buffer.from('evidence')).digest).toBe(ref.digest);
    expect(() => cas.get({ ...ref, digest: '../secret' })).toThrow('Invalid');
    writeFileSync(join(dir, ref.digest), 'changed');
    expect(() => cas.get(ref)).toThrow('integrity');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
