import { describe, it, expect } from 'vitest';
import {
  createTask,
  applyCommand,
  readyUnits,
  selectContext,
  assertGraph,
} from '../packages/core/src/index';
import { createTaskSchema } from '../packages/contracts/src/index';
import { DemoBudgetLedger } from '../packages/budget/src/index';
import { summarize } from '../packages/evals/src/index';
const task = () =>
  createTask(
    createTaskSchema.parse({ title: 'Sample workflow', goal: 'Verify orchestration' }),
    'task-1',
  );
describe('orchestration invariants', () => {
  it('only exposes dependency-ready units', () => {
    const t = task();
    expect(readyUnits(t.units).map((u) => u.id)).toEqual(['spec']);
    t.units[0].status = 'completed';
    expect(readyUnits(t.units).map((u) => u.id)).toEqual(['implementation', 'checks']);
  });
  it('rejects cycles and dangling dependencies', () => {
    const t = task();
    t.units[0].dependencies = ['review'];
    expect(() => assertGraph(t.units)).toThrow('Cyclic');
    t.units[0].dependencies = ['missing'];
    expect(() => assertGraph(t.units)).toThrow('Missing');
  });
  it('requires explicit verification before completion', () => {
    let t = task();
    t = applyCommand(t, { action: 'start', expectedRevision: 0 }).task;
    for (let i = 0; i < 4; i++)
      t = applyCommand(t, { action: 'advance', expectedRevision: t.revision }).task;
    expect(t.status).toBe('verifying');
    expect(t.actualCostUsd).toBeNull();
    t = applyCommand(t, { action: 'advance', expectedRevision: t.revision }).task;
    expect(t.status).toBe('completed');
    expect(() => applyCommand(t, { action: 'start', expectedRevision: t.revision })).toThrow();
  });
  it('rejects stale commands without changing state', () => {
    const t = task();
    expect(() => applyCommand(t, { action: 'start', expectedRevision: 99 })).toThrow('revision');
    expect(t.status).toBe('ready');
  });
  it('does not advance a paused task', () => {
    let t = applyCommand(task(), { action: 'start', expectedRevision: 0 }).task;
    t = applyCommand(t, { action: 'pause', expectedRevision: 1 }).task;
    expect(() => applyCommand(t, { action: 'advance', expectedRevision: 2 })).toThrow();
    t = applyCommand(t, { action: 'resume', expectedRevision: 2 }).task;
    expect(t.status).toBe('running');
  });
  it('never silently truncates required evidence', () => {
    const items = [
      { id: 'spec', text: 'constraints', estimatedTokens: 10, required: true, relevance: 0 },
      { id: 'optional', text: 'extra', estimatedTokens: 10, required: false, relevance: 1 },
    ];
    expect(() => selectContext(items, 9)).toThrow('Required');
    const result = selectContext(items, 10);
    expect(result.selected.map((i) => i.id)).toEqual(['spec']);
    expect(result.omitted).toEqual(['optional']);
    expect(items).toHaveLength(2);
  });
  it('keeps shared pool reservations within budget', () => {
    const ledger = new DemoBudgetLedger({ shared: 10 });
    ledger.reserve('a', 'shared', 6);
    expect(() => ledger.reserve('b', 'shared', 5)).toThrow('exhausted');
    ledger.settle('a', 4);
    expect(ledger.reserve('b', 'shared', 5).status).toBe('reserved');
    expect(() => ledger.settle('a', 1)).toThrow('conflict');
  });
  it('includes failed-run cost in cost per acceptance', () => {
    expect(
      summarize([
        {
          arm: 'strong',
          taskId: 'a',
          passed: false,
          costUsd: 3,
          durationMs: 10,
          humanRepairMinutes: 0,
        },
        {
          arm: 'strong',
          taskId: 'b',
          passed: true,
          costUsd: 2,
          durationMs: 20,
          humanRepairMinutes: 0,
        },
      ]).costPerAccepted,
    ).toBe(5);
    expect(summarize([]).passRate).toBeNull();
  });
});
