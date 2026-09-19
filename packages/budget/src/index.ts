export { DurableBudgetLedger } from './durable';
export interface Reservation {
  id: string;
  poolId: string;
  estimatedUsd: number;
  status: 'reserved' | 'settled';
  actualUsd: number | null;
}
export class DemoBudgetLedger {
  private reservations = new Map<string, Reservation>();
  constructor(private caps: Record<string, number>) {}
  reserve(id: string, poolId: string, amount: number): Reservation {
    const existing = this.reservations.get(id);
    if (existing) {
      if (existing.poolId !== poolId || existing.estimatedUsd !== amount)
        throw new Error('Reservation conflict');
      return { ...existing };
    }
    if (!Number.isFinite(amount) || amount < 0 || !Object.hasOwn(this.caps, poolId))
      throw new Error('Invalid reservation');
    const consumed = [...this.reservations.values()]
      .filter((r) => r.poolId === poolId)
      .reduce((sum, r) => sum + (r.actualUsd ?? r.estimatedUsd), 0);
    if (consumed + amount > this.caps[poolId]) throw new Error('Budget exhausted');
    const reservation: Reservation = {
      id,
      poolId,
      estimatedUsd: amount,
      status: 'reserved',
      actualUsd: null,
    };
    this.reservations.set(id, reservation);
    return { ...reservation };
  }
  settle(id: string, actual: number): Reservation {
    const row = this.reservations.get(id);
    if (!row || !Number.isFinite(actual) || actual < 0) throw new Error('Invalid settlement');
    if (row.status === 'settled' && row.actualUsd !== actual)
      throw new Error('Settlement conflict');
    row.status = 'settled';
    row.actualUsd = actual;
    return { ...row };
  }
}
// Demonstration-only in-memory ledger. Production reservations must join the SQLite scheduler transaction.
