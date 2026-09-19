import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

type Row = {
  id: string;
  pool: string;
  estimate: number;
  actual: number | null;
  state: 'reserved' | 'dispatched' | 'unknown' | 'settled' | 'released';
};
const amount = (value: number) => {
  if (!Number.isSafeInteger(value) || value < 0 || value > 1e12)
    throw new Error('Expected integer micro-USD between 0 and 1e12');
};
const identifier = (value: string) => {
  if (!value.trim() || value.length > 256) throw new Error('Invalid identifier');
};

/** Standalone durable accounting foundation; scheduler integration remains explicit. */
export class DurableBudgetLedger {
  private db: DatabaseSync;
  constructor(file: string) {
    if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(file);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS budget_pools(id TEXT PRIMARY KEY, cap INTEGER NOT NULL CHECK(cap >= 0));
      CREATE TABLE IF NOT EXISTS budget_reservations(id TEXT PRIMARY KEY, pool TEXT NOT NULL REFERENCES budget_pools(id), estimate INTEGER NOT NULL CHECK(estimate >= 0), actual INTEGER, state TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS runner_leases(resource TEXT PRIMARY KEY, holder TEXT NOT NULL, fence INTEGER NOT NULL, expires INTEGER NOT NULL);`);
  }
  close() {
    this.db.close();
  }
  private transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = fn();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  createPool(id: string, cap: number) {
    identifier(id);
    amount(cap);
    this.transaction(() => {
      const old = this.db.prepare('SELECT cap FROM budget_pools WHERE id=?').get(id);
      if (old && old.cap !== cap) throw new Error('Pool cap conflict');
      this.db.prepare('INSERT OR IGNORE INTO budget_pools VALUES(?,?)').run(id, cap);
    });
  }
  balance(pool: string) {
    const row = this.db.prepare('SELECT cap FROM budget_pools WHERE id=?').get(pool);
    if (!row) throw new Error('Unknown pool');
    const used = this.db
      .prepare(
        "SELECT COALESCE(SUM(CASE WHEN state='released' THEN 0 WHEN state='settled' THEN actual ELSE estimate END),0) AS used FROM budget_reservations WHERE pool=?",
      )
      .get(pool)!;
    return {
      cap: Number(row.cap),
      committed: Number(used.used),
      remaining: Math.max(0, Number(row.cap) - Number(used.used)),
      overspent: Math.max(0, Number(used.used) - Number(row.cap)),
    };
  }
  get(id: string): Row {
    const row = this.db.prepare('SELECT * FROM budget_reservations WHERE id=?').get(id);
    if (!row) throw new Error('Unknown reservation');
    return row as Row;
  }
  reserve(id: string, pool: string, estimate: number): Row {
    identifier(id);
    identifier(pool);
    amount(estimate);
    return this.transaction(() => {
      const old = this.db.prepare('SELECT * FROM budget_reservations WHERE id=?').get(id) as
        Row | undefined;
      if (old) {
        if (old.pool !== pool || old.estimate !== estimate) throw new Error('Reservation conflict');
        return old;
      }
      if (this.balance(pool).remaining < estimate) throw new Error('Budget exhausted');
      this.db
        .prepare("INSERT INTO budget_reservations VALUES(?,?,?,NULL,'reserved')")
        .run(id, pool, estimate);
      return this.get(id);
    });
  }
  transition(id: string, state: 'dispatched' | 'unknown' | 'released') {
    return this.transaction(() => {
      const row = this.get(id);
      if (row.state === state) return row;
      const valid = state === 'unknown' ? row.state === 'dispatched' : row.state === 'reserved';
      if (!valid) throw new Error('Invalid reservation transition');
      this.db.prepare('UPDATE budget_reservations SET state=? WHERE id=?').run(state, id);
      return this.get(id);
    });
  }
  settle(id: string, actual: number) {
    amount(actual);
    return this.transaction(() => {
      const row = this.get(id);
      if (row.state === 'settled') {
        if (row.actual !== actual) throw new Error('Settlement conflict');
        return row;
      }
      if (!['dispatched', 'unknown'].includes(row.state))
        throw new Error('Only dispatched usage can be settled');
      // Actual charges may exceed the estimate; record the truth rather than clamp it to the cap.
      this.db
        .prepare("UPDATE budget_reservations SET state='settled',actual=? WHERE id=?")
        .run(actual, id);
      return this.get(id);
    });
  }
  acquireLease(resource: string, holder: string, ttlMs: number, now = Date.now()) {
    identifier(resource);
    identifier(holder);
    this.validateTime(ttlMs, now);
    return this.transaction(() => {
      const old = this.db
        .prepare('SELECT fence,expires FROM runner_leases WHERE resource=?')
        .get(resource);
      if (old && Number(old.expires) > now) throw new Error('Runner already leased');
      const fence = Number(old?.fence ?? 0) + 1;
      this.db
        .prepare(
          'INSERT INTO runner_leases VALUES(?,?,?,?) ON CONFLICT(resource) DO UPDATE SET holder=excluded.holder,fence=excluded.fence,expires=excluded.expires',
        )
        .run(resource, holder, fence, now + ttlMs);
      return { resource, holder, fence, expires: now + ttlMs };
    });
  }
  renewLease(resource: string, holder: string, fence: number, ttlMs: number, now = Date.now()) {
    this.validateTime(ttlMs, now);
    const result = this.db
      .prepare(
        'UPDATE runner_leases SET expires=? WHERE resource=? AND holder=? AND fence=? AND expires>?',
      )
      .run(now + ttlMs, resource, holder, fence, now);
    if (result.changes !== 1) throw new Error('Stale lease');
  }
  private validateTime(ttl: number, now: number) {
    if (
      !Number.isSafeInteger(ttl) ||
      ttl < 1 ||
      ttl > 3600000 ||
      !Number.isSafeInteger(now) ||
      now < 0 ||
      !Number.isSafeInteger(now + ttl)
    )
      throw new Error('Invalid lease time');
  }
}
