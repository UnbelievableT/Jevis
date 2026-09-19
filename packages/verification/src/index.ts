export interface CheckEvidence {
  checkId: string;
  specRevision: number;
  artifactDigest: string;
  outcome: 'passed' | 'failed' | 'unknown';
  independent: boolean;
}
export function verifyEvidence(
  requiredChecks: string[],
  revision: number,
  evidence: CheckEvidence[],
): { status: 'accepted' | 'rejected' | 'incomplete'; missing: string[] } {
  if (!requiredChecks.length) return { status: 'incomplete', missing: ['acceptance-contract'] };
  const relevant = evidence.filter((e) => e.specRevision === revision && e.independent);
  const missing = requiredChecks.filter(
    (id) => !relevant.some((e) => e.checkId === id && e.outcome === 'passed'),
  );
  if (relevant.some((e) => requiredChecks.includes(e.checkId) && e.outcome === 'failed'))
    return { status: 'rejected', missing };
  return { status: missing.length ? 'incomplete' : 'accepted', missing };
}
export interface CheckPlugin {
  id: string;
  run(input: {
    workspacePath: string;
    specRevision: number;
    artifactDigests: string[];
  }): Promise<CheckEvidence[]>;
}
