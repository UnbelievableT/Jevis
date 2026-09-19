import type {
  RunnerAdapter,
  RunnerContext,
  RunnerResult,
  Checkpoint,
} from '../../contracts/src/index';
export interface RunnerLease {
  id: string;
  taskId: string;
  unitId: string;
  fencingToken: number;
  expiresAt: string;
}
export interface RunnerService {
  dispatch(
    adapter: RunnerAdapter,
    context: RunnerContext,
    lease: RunnerLease,
  ): Promise<RunnerResult>;
  checkpoint(lease: RunnerLease): Promise<Checkpoint>;
  resume(checkpoint: Checkpoint, adapter: RunnerAdapter): Promise<RunnerLease>;
}
// Lease fencing, cancellation reconciliation and checkpoint validation must precede real runner activation.
