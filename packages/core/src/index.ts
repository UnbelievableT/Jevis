import { createMachine, getNextSnapshot } from 'xstate';
import type {
  Task,
  TaskStatus,
  WorkUnit,
  Command,
  CreateTask,
  SupplyProfile,
} from '../../contracts/src/index';
export class DomainError extends Error {
  constructor(
    message: string,
    public code = 'invalid_state',
    public status = 409,
  ) {
    super(message);
  }
}
export const taskMachine = createMachine({
  id: 'task',
  initial: 'ready',
  states: {
    ready: { on: { start: 'running', cancel: 'cancelled' } },
    running: { on: { pause: 'paused', verify: 'verifying', cancel: 'cancelled', fail: 'failed' } },
    paused: { on: { resume: 'running', cancel: 'cancelled' } },
    verifying: { on: { accept: 'completed', fail: 'failed', cancel: 'cancelled' } },
    completed: { type: 'final' },
    failed: { type: 'final' },
    cancelled: { type: 'final' },
  },
});
export function assertGraph(units: WorkUnit[]): void {
  const byId = new Map(units.map((u) => [u.id, u]));
  if (byId.size !== units.length)
    throw new DomainError('Duplicate work unit', 'invalid_graph', 400);
  const seen = new Set<string>(),
    visiting = new Set<string>();
  function visit(id: string) {
    if (visiting.has(id)) throw new DomainError('Cyclic dependency', 'invalid_graph', 400);
    if (seen.has(id)) return;
    const u = byId.get(id);
    if (!u) throw new DomainError('Missing dependency: ' + id, 'invalid_graph', 400);
    visiting.add(id);
    u.dependencies.forEach(visit);
    visiting.delete(id);
    seen.add(id);
  }
  units.forEach((u) => visit(u.id));
}
export function readyUnits(units: WorkUnit[]): WorkUnit[] {
  assertGraph(units);
  return units.filter(
    (u) =>
      u.status === 'pending' &&
      u.dependencies.every((id) => units.find((d) => d.id === id)?.status === 'completed'),
  );
}
export function createTask(input: CreateTask, id: string, now = new Date().toISOString()): Task {
  return {
    ...input,
    id,
    status: 'ready',
    revision: 0,
    actualCostUsd: null,
    createdAt: now,
    updatedAt: now,
    units: [
      {
        id: 'spec',
        title: '明确目标与验收条件',
        role: 'architect',
        dependencies: [],
        status: 'pending',
        executor: 'demo-architect',
        evidence: [],
      },
      {
        id: 'implementation',
        title: '完成有边界的实现',
        role: 'worker',
        dependencies: ['spec'],
        status: 'pending',
        executor: 'demo-worker',
        evidence: [],
      },
      {
        id: 'checks',
        title: '检查接口与约束',
        role: 'worker',
        dependencies: ['spec'],
        status: 'pending',
        executor: 'demo-worker',
        evidence: [],
      },
      {
        id: 'review',
        title: '独立检查交付结果',
        role: 'reviewer',
        dependencies: ['implementation', 'checks'],
        status: 'pending',
        executor: 'demo-reviewer',
        evidence: [],
      },
    ],
  };
}
export function applyCommand(
  task: Task,
  command: Command,
  now = new Date().toISOString(),
): { task: Task; detail: string } {
  if (command.expectedRevision !== task.revision)
    throw new DomainError('Task revision changed; refresh before retrying.', 'revision_conflict');
  const next = structuredClone(task);
  let detail = '';
  const move = (event: string): TaskStatus => {
    const snapshot = taskMachine.resolveState({ value: task.status, context: {} });
    const target = getNextSnapshot(taskMachine, snapshot, { type: event });
    if (target.value === snapshot.value)
      throw new DomainError('Command is not allowed in ' + task.status);
    return target.value as TaskStatus;
  };
  if (command.action === 'advance') {
    if (!['running', 'verifying'].includes(task.status))
      throw new DomainError('Command is not allowed in ' + task.status);
    if (next.status === 'verifying') {
      next.status = move('accept');
      detail = '演示验收完成；未调用真实模型，也未验证代码。';
    } else {
      const unit = readyUnits(next.units)[0];
      if (!unit) throw new DomainError('No runnable work unit', 'no_runnable_unit');
      unit.status = 'completed';
      unit.evidence.push('demo:' + unit.id + ':fixture-v1');
      detail = '演示完成：' + unit.title;
      if (next.units.every((u) => u.status === 'completed')) next.status = move('verify');
    }
  } else {
    next.status = move(command.action);
    detail = (
      {
        start: '启动演示工作流',
        pause: '任务已暂停',
        resume: '任务已继续',
        cancel: '任务已取消',
      } as const
    )[command.action];
  }
  next.revision++;
  next.updatedAt = now;
  return { task: next, detail };
}
export function chooseSupply(
  role: WorkUnit['role'],
  supplies: SupplyProfile[],
): SupplyProfile | undefined {
  const tier = role === 'worker' ? 'standard' : 'strong';
  return supplies.find((s) => s.availability === 'demo' && s.tier === tier && s.kind === 'demo');
}
export interface ContextItem {
  id: string;
  text: string;
  estimatedTokens: number;
  required: boolean;
  relevance: number;
}
export function selectContext(
  items: ContextItem[],
  maxTokens: number,
): { selected: ContextItem[]; omitted: string[]; estimatedTokens: number } {
  if (!Number.isFinite(maxTokens) || maxTokens < 0)
    throw new DomainError('Invalid context budget', 'invalid_context', 400);
  if (
    items.some(
      (i) =>
        !Number.isFinite(i.estimatedTokens) ||
        i.estimatedTokens < 0 ||
        !Number.isFinite(i.relevance),
    )
  )
    throw new DomainError('Invalid context item', 'invalid_context', 400);
  const selected = items.filter((i) => i.required);
  let used = selected.reduce((n, i) => n + i.estimatedTokens, 0);
  if (used > maxTokens)
    throw new DomainError(
      'Required evidence exceeds context budget; do not silently discard it.',
      'context_overflow',
      400,
    );
  for (const item of items.filter((i) => !i.required).sort((a, b) => b.relevance - a.relevance)) {
    if (used + item.estimatedTokens <= maxTokens) {
      selected.push(item);
      used += item.estimatedTokens;
    }
  }
  return {
    selected,
    omitted: items.filter((i) => !selected.includes(i)).map((i) => i.id),
    estimatedTokens: used,
  };
}
