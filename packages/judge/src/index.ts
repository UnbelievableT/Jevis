import type { JudgeAdapter, JudgeQuestion, JudgeAnswer } from '../../contracts/src/index';
export { JevAdapter } from './jev';
export class UnconfiguredJev implements JudgeAdapter {
  async evaluate(
    _state: string,
    _questions: JudgeQuestion[],
  ): Promise<{ model: string; answers: JudgeAnswer[] }> {
    throw new Error(
      'Jev is not connected. No synthetic probability is substituted for model evidence.',
    );
  }
}
export interface QuestionPack {
  id: string;
  version: string;
  modelVersion: string;
  questions: JudgeQuestion[];
  calibrationDataset: string | null;
}
export const contextQuestionPack: QuestionPack = {
  id: 'context-relevance',
  version: '1.0.0',
  modelVersion: 'unconfigured',
  calibrationDataset: null,
  questions: [
    {
      id: 'relevant',
      kind: 'noul',
      prompt: 'Does this candidate contain evidence needed for the stated work unit?',
    },
  ],
};
