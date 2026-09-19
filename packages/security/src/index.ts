import { realpath } from 'node:fs/promises';
import { relative, isAbsolute } from 'node:path';
export type Operation = 'read' | 'write' | 'process' | 'network' | 'publish';
export interface ExecutionPolicy {
  root: string;
  allowed: Operation[];
  sandboxVerified: boolean;
}
export async function authorize(
  policy: ExecutionPolicy,
  operation: Operation,
  target?: string,
): Promise<{ allowed: boolean; reason: string }> {
  if (!policy.allowed.includes(operation))
    return { allowed: false, reason: 'Operation not authorized' };
  if (operation !== 'read' && !policy.sandboxVerified)
    return { allowed: false, reason: 'A verified sandbox is required' };
  if (target) {
    const root = await realpath(policy.root);
    let actual: string;
    try {
      actual = await realpath(target);
    } catch {
      return {
        allowed: false,
        reason: 'Target does not exist; creation needs sandbox enforcement',
      };
    }
    const rel = relative(root, actual);
    if (
      rel === '..' ||
      rel.startsWith('..' + (process.platform === 'win32' ? '\\' : '/')) ||
      isAbsolute(rel)
    )
      return { allowed: false, reason: 'Target escapes project root' };
  }
  return { allowed: true, reason: 'Policy preflight passed; OS enforcement remains required' };
}
export type OperationState =
  'prepared' | 'authorized' | 'dispatched' | 'confirmed' | 'failed' | 'unknown';
export interface OperationRecord {
  id: string;
  taskId: string;
  state: OperationState;
  idempotencyKey: string;
  externalReceipt?: string;
}
export function mayRetry(record: OperationRecord): boolean {
  return record.state === 'prepared' || record.state === 'authorized';
}
