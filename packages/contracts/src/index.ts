import { z } from 'zod';
export const API_VERSION = 'v1' as const;
export const taskStatusSchema = z.enum([
  'ready',
  'running',
  'paused',
  'verifying',
  'completed',
  'failed',
  'cancelled',
]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export const unitSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  role: z.enum(['architect', 'worker', 'reviewer']),
  dependencies: z.array(z.string()),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  executor: z.string(),
  evidence: z.array(z.string()).default([]),
});
export type WorkUnit = z.infer<typeof unitSchema>;
export const createTaskSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    goal: z.string().trim().min(3).max(4000),
    budgetUsd: z.number().finite().min(0.01).max(10000).default(5),
    mode: z.literal('demo').default('demo'),
  })
  .strict();
export type CreateTask = z.infer<typeof createTaskSchema>;
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  goal: z.string(),
  mode: z.literal('demo'),
  status: taskStatusSchema,
  revision: z.number().int().nonnegative(),
  budgetUsd: z.number(),
  actualCostUsd: z.number().nullable(),
  units: z.array(unitSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Task = z.infer<typeof taskSchema>;
export const commandSchema = z
  .object({
    action: z.enum(['start', 'advance', 'pause', 'resume', 'cancel']),
    expectedRevision: z.number().int().nonnegative(),
  })
  .strict();
export type Command = z.infer<typeof commandSchema>;
export interface TaskEvent {
  sequence: number;
  taskId: string;
  revision: number;
  type: string;
  timestamp: string;
  detail: string;
}
export interface SupplyProfile {
  id: string;
  name: string;
  kind: 'agent' | 'inference' | 'judge' | 'demo';
  tier: 'strong' | 'standard' | 'judge';
  availability: 'demo' | 'not_configured';
  modelControl: 'enforced' | 'unsupported' | 'unverified';
  sandbox: 'none' | 'required';
}
export interface ArtifactRef {
  digest: string;
  mediaType: string;
  size: number;
}
export interface Checkpoint {
  version: 1;
  taskId: string;
  revision: number;
  specVersion: string;
  workspaceRef: string;
  artifacts: ArtifactRef[];
  unresolvedOperations: string[];
}
export interface RunnerContext {
  taskId: string;
  unit: WorkUnit;
  contextRefs: ArtifactRef[];
  signal: AbortSignal;
}
export interface RunnerResult {
  status: 'completed' | 'failed' | 'blocked';
  evidence: ArtifactRef[];
  actualCostUsd: number | null;
}
export interface RunnerAdapter {
  id: string;
  run(context: RunnerContext): Promise<RunnerResult>;
  cancel(taskId: string): Promise<void>;
}
export type JudgeQuestion =
  | { id: string; kind: 'choice'; prompt: string; options: string[] }
  | { id: string; kind: 'score'; prompt: string; levels: number[]; descriptions?: string[] }
  | { id: string; kind: 'noul'; prompt: string };
export type JudgeAnswer =
  | {
      id: string;
      kind: 'choice';
      choice: string;
      probabilities: Record<string, number>;
      confidence: number;
    }
  | {
      id: string;
      kind: 'score';
      score: number;
      probabilities: Record<string, number>;
      confidence: number;
    }
  | { id: string; kind: 'noul'; noul: number };
export interface JudgeAdapter {
  evaluate(
    state: string,
    questions: JudgeQuestion[],
  ): Promise<{ model: string; answers: JudgeAnswer[] }>;
}
