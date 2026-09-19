export { selectContext, type ContextItem } from '../../core/src/index';
import type { ArtifactRef } from '../../contracts/src/index';
export interface ContextView {
  id: string;
  specRevision: number;
  rawSources: ArtifactRef[];
  selected: ArtifactRef[];
  omitted: ArtifactRef[];
  tokenizer: string;
  tokenCount: number;
  policyVersion: string;
}
export interface Retriever {
  retrieve(
    query: string,
    projectSnapshotRef: string,
  ): Promise<Array<{ ref: ArtifactRef; score: number }>>;
}
export interface ContextBuilder {
  build(input: {
    unitId: string;
    specRevision: number;
    maxTokens: number;
    required: ArtifactRef[];
  }): Promise<ContextView>;
}
// Omission changes a view, not raw evidence. Required evidence must fit or force an explicit replan.
