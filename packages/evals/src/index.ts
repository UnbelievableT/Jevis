export interface EvaluationResult {
  arm: 'strong' | 'standard' | 'mixed' | 'mixed-with-jev';
  taskId: string;
  passed: boolean;
  costUsd: number;
  durationMs: number;
  humanRepairMinutes: number;
}
export function summarize(rows: EvaluationResult[]) {
  if (!rows.length) return { runs: 0, passRate: null, costPerAccepted: null };
  if (rows.some((r) => !Number.isFinite(r.costUsd) || r.costUsd < 0))
    throw new Error('Invalid cost');
  const accepted = rows.filter((r) => r.passed).length;
  return {
    runs: rows.length,
    passRate: accepted / rows.length,
    costPerAccepted: accepted ? rows.reduce((n, r) => n + r.costUsd, 0) / accepted : null,
  };
}
