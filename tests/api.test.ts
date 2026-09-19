import { it, expect } from 'vitest';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { Store } from '../packages/storage/src/index';
import { createApi } from '../apps/daemon/src/server';
it('authenticates, validates, handles conflicts and replays SSE events', async () => {
  const store = new Store(':memory:');
  const token = 't'.repeat(64);
  const server = createApi(store, token);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port + '/api/v1';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
    'Idempotency-Key': 'create-test-123',
  };
  try {
    expect((await fetch(base + '/tasks')).status).toBe(401);
    expect(
      (await fetch(base + '/tasks', { headers: { ...headers, Origin: 'https://evil.example' } }))
        .status,
    ).toBe(403);
    expect(
      (await fetch(base + '/tasks', { method: 'POST', headers, body: 'not-json' })).status,
    ).toBe(400);
    expect(
      (
        await fetch(base + '/tasks', {
          method: 'POST',
          headers,
          body: JSON.stringify({ title: 'a', goal: 'b', budgetUsd: -1 }),
        })
      ).status,
    ).toBe(400);
    const response = await fetch(base + '/tasks', {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'API task', goal: 'Verify API contract' }),
    });
    expect(response.status).toBe(201);
    const { task } = await response.json();
    const started = await fetch(base + '/tasks/' + task.id + '/commands', {
      method: 'POST',
      headers: { ...headers, 'Idempotency-Key': 'start-test-123' },
      body: JSON.stringify({ action: 'start', expectedRevision: 0 }),
    });
    expect(started.status).toBe(200);
    expect(
      (
        await fetch(base + '/tasks/' + task.id + '/commands', {
          method: 'POST',
          headers: { ...headers, 'Idempotency-Key': 'stale-test-123' },
          body: JSON.stringify({ action: 'pause', expectedRevision: 0 }),
        })
      ).status,
    ).toBe(409);
    const stream = await fetch(base + '/events?after=1', {
      headers: { Authorization: 'Bearer ' + token, Accept: 'text/event-stream' },
    });
    const reader = stream.body!.getReader();
    const first = await reader.read();
    expect(new TextDecoder().decode(first.value)).toContain('id: 2');
    await reader.cancel();
  } finally {
    server.closeAllConnections();
    await new Promise<void>((r) => server.close(() => r()));
    store.close();
  }
});
