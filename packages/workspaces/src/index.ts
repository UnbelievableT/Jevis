export interface WorkspaceSnapshot {
  id: string;
  projectRoot: string;
  baseCommit: string;
  dirtyPatchRef: string | null;
  environmentFingerprint: string;
}
export interface WorkspaceDriver {
  prepare(snapshot: WorkspaceSnapshot): Promise<{ path: string; leaseId: string }>;
  inspect(leaseId: string): Promise<{ changedFiles: string[]; unresolvedOperations: string[] }>;
  release(leaseId: string): Promise<void>;
}
export const workspacePolicy = {
  integrationWriters: 1,
  worktreeIsSandbox: false,
  preserveUserChanges: true,
} as const;
