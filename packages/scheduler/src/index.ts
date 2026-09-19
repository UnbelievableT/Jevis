import type { WorkUnit, SupplyProfile } from '../../contracts/src/index';
import { readyUnits, chooseSupply } from '../../core/src/index';
export interface SchedulingDecision {
  unitId: string;
  supplyId: string;
  reason: string;
  policyVersion: string;
  mode: 'demo';
}
export function scheduleDemo(units: WorkUnit[], supplies: SupplyProfile[]): SchedulingDecision[] {
  return readyUnits(units).flatMap((unit) => {
    const supply = chooseSupply(unit.role, supplies);
    return supply
      ? [
          {
            unitId: unit.id,
            supplyId: supply.id,
            reason: 'Deterministic fixture tier mapping; not learned capability.',
            policyVersion: 'demo-v1',
            mode: 'demo' as const,
          },
        ]
      : [];
  });
}
export interface ProductionScheduler {
  decide(input: {
    taskId: string;
    specRevision: number;
    budgetReservationId: string;
    contextRef: string;
    policyVersion: string;
  }): Promise<{
    action: 'execute' | 'request_context' | 'escalate' | 'replan' | 'wait';
    reason: string;
  }>;
}
