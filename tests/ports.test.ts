import { it, expect } from 'vitest';
import { verifyEvidence } from '../packages/verification/src/index';
import { UnconfiguredSandbox } from '../packages/sandbox/src/index';
import { scheduleDemo } from '../packages/scheduler/src/index';
import { createTask } from '../packages/core/src/index';
import { supplies } from '../packages/adapters/src/index';
it('requires independent evidence from the current spec revision', () => {
  const evidence = [
    {
      checkId: 'tests',
      specRevision: 1,
      artifactDigest: 'abc',
      outcome: 'passed' as const,
      independent: true,
    },
  ];
  expect(verifyEvidence(['tests'], 2, evidence).status).toBe('incomplete');
  expect(verifyEvidence(['tests'], 1, evidence).status).toBe('accepted');
  expect(verifyEvidence(['tests'], 1, [{ ...evidence[0], independent: false }]).status).toBe(
    'incomplete',
  );
  expect(
    verifyEvidence(['tests'], 1, [...evidence, { ...evidence[0], outcome: 'failed' }]).status,
  ).toBe('rejected');
});
it('sandbox port fails closed until a real driver is configured', async () => {
  const sandbox = new UnconfiguredSandbox();
  expect((await sandbox.probe()).verified).toBe(false);
  await expect(sandbox.run()).rejects.toThrow('disabled');
});
it('demo scheduler never activates a real provider', () => {
  const t = createTask(
    { title: 'Demo task', goal: 'Check routing', budgetUsd: 5, mode: 'demo' },
    'x',
  );
  const decisions = scheduleDemo(t.units, supplies);
  expect(decisions).toHaveLength(1);
  expect(decisions[0].supplyId).toBe('demo-architect');
  expect(
    scheduleDemo(
      t.units,
      supplies.filter((s) => s.kind !== 'demo'),
    ),
  ).toEqual([]);
});
