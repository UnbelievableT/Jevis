import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { DurableBudgetLedger } from '../packages/budget/src/index';
describe('durable shared budget and runner lease', () => {
  it('coordinates independent connections, survives restart, and retains unknown cost', () => {
    const dir = mkdtempSync(join(tmpdir(), 'jevis-ledger-'));
    const path = join(dir, 'ledger.sqlite');
    const a = new DurableBudgetLedger(path),
      b = new DurableBudgetLedger(path);
    try {
      a.createPool('shared', 1000000);
      a.reserve('request-a', 'shared', 700000);
      expect(() => b.reserve('request-b', 'shared', 400000)).toThrow('exhausted');
      expect(b.reserve('request-a', 'shared', 700000).state).toBe('reserved');
      expect(() => b.reserve('request-a', 'shared', 600000)).toThrow('conflict');
      a.transition('request-a', 'dispatched');
      a.transition('request-a', 'unknown');
      expect(() => b.transition('request-a', 'released')).toThrow('transition');
      const c = new DurableBudgetLedger(path);
      try {
        expect(c.balance('shared').remaining).toBe(300000);
        c.settle('request-a', 1200000);
      } finally {
        c.close();
      }
      expect(b.balance('shared')).toMatchObject({ remaining: 0, overspent: 200000 });
      expect(() => b.settle('request-a', 1)).toThrow('conflict');
    } finally {
      a.close();
      b.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it('fences out an expired owner after another worker acquires the resource', () => {
    const ledger = new DurableBudgetLedger(':memory:');
    try {
      const first = ledger.acquireLease('workspace', 'runner-a', 100, 1000);
      expect(() => ledger.acquireLease('workspace', 'runner-b', 100, 1050)).toThrow('leased');
      const next = ledger.acquireLease('workspace', 'runner-b', 100, 1100);
      expect(next.fence).toBe(first.fence + 1);
      expect(() => ledger.renewLease('workspace', 'runner-a', first.fence, 100, 1110)).toThrow(
        'Stale',
      );
      ledger.renewLease('workspace', 'runner-b', next.fence, 100, 1150);
      expect(() => ledger.renewLease('workspace', 'runner-b', next.fence, 100, 1300)).toThrow(
        'Stale',
      );
    } finally {
      ledger.close();
    }
  });
  it('releases only undispatched reservations and enforces exact integer money', () => {
    const ledger = new DurableBudgetLedger(':memory:');
    try {
      ledger.createPool('pool', 100);
      expect(() => ledger.reserve('bad', 'pool', 0.1)).toThrow('integer');
      ledger.reserve('ok', 'pool', 100);
      ledger.transition('ok', 'released');
      expect(ledger.balance('pool').remaining).toBe(100);
      expect(() => ledger.transition('ok', 'dispatched')).toThrow('transition');
    } finally {
      ledger.close();
    }
  });
});
