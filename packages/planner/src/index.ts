import { z } from 'zod';
export const specSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().min(1),
    revision: z.number().int().positive(),
    goal: z.string().min(1),
    constraints: z.array(z.string()),
    acceptance: z
      .array(z.object({ id: z.string(), description: z.string(), required: z.boolean() }))
      .min(1),
    baselineCommit: z.string().min(1),
    parentSpecId: z.string().nullable(),
  })
  .strict();
export type Specification = z.infer<typeof specSchema>;
export interface Planner {
  plan(input: {
    goal: string;
    projectSnapshotRef: string;
    previousSpec?: Specification;
  }): Promise<Specification>;
}
export interface SpecRevision {
  supersedes: string;
  invalidatedUnits: string[];
  reason: string;
}
// Specs are immutable records. A new revision invalidates affected descendants, not an in-place prompt edit.
