import type {
  SupplyProfile,
  RunnerAdapter,
  RunnerContext,
  RunnerResult,
} from '../../contracts/src/index';
export const supplies: SupplyProfile[] = [
  {
    id: 'demo-architect',
    name: '演示 · 架构模型',
    kind: 'demo',
    tier: 'strong',
    availability: 'demo',
    modelControl: 'enforced',
    sandbox: 'none',
  },
  {
    id: 'demo-worker',
    name: '演示 · 执行模型',
    kind: 'demo',
    tier: 'standard',
    availability: 'demo',
    modelControl: 'enforced',
    sandbox: 'none',
  },
  {
    id: 'demo-reviewer',
    name: '演示 · 验收模型',
    kind: 'demo',
    tier: 'strong',
    availability: 'demo',
    modelControl: 'enforced',
    sandbox: 'none',
  },
  {
    id: 'codex',
    name: 'Codex',
    kind: 'agent',
    tier: 'strong',
    availability: 'not_configured',
    modelControl: 'unverified',
    sandbox: 'required',
  },
  {
    id: 'claude',
    name: 'Claude Agent',
    kind: 'agent',
    tier: 'strong',
    availability: 'not_configured',
    modelControl: 'unverified',
    sandbox: 'required',
  },
  {
    id: 'pi',
    name: '第三方 / 本地模型 · Pi',
    kind: 'inference',
    tier: 'standard',
    availability: 'not_configured',
    modelControl: 'unverified',
    sandbox: 'required',
  },
  {
    id: 'jev',
    name: 'Jev · TypeSafe',
    kind: 'judge',
    tier: 'judge',
    availability: 'not_configured',
    modelControl: 'unverified',
    sandbox: 'none',
  },
];
export class UnconfiguredRunner implements RunnerAdapter {
  constructor(public id: string) {}
  async run(_context: RunnerContext): Promise<RunnerResult> {
    throw new Error(
      this.id + ' adapter is not implemented. Configure a supported SDK and sandbox first.',
    );
  }
  async cancel(_taskId: string): Promise<void> {
    throw new Error('Cancellation is not implemented for ' + this.id);
  }
}
export class AdapterRegistry {
  private runners = new Map<string, RunnerAdapter>();
  register(runner: RunnerAdapter) {
    if (this.runners.has(runner.id)) throw new Error('Duplicate adapter ' + runner.id);
    this.runners.set(runner.id, runner);
  }
  get(id: string) {
    const runner = this.runners.get(id);
    if (!runner) throw new Error('Adapter not registered: ' + id);
    return runner;
  }
}
