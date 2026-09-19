export interface ExperienceRecord {
  id: string;
  projectId: string;
  policyVersion: string;
  taskId: string;
  outcome: 'accepted' | 'rejected' | 'unknown';
  evidenceRefs: string[];
  exportConsent: false;
}
export interface PolicyProposal {
  id: string;
  baselineVersion: string;
  candidateVersion: string;
  evaluationRunIds: string[];
  status: 'proposed' | 'shadow' | 'approved' | 'rejected';
}
export const experienceDefaults = {
  localOnly: true,
  automaticPermissionExpansion: false,
  heldOutEvaluationRequired: true,
} as const;
