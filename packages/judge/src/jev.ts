import { TypeSafeClient, type Questions, type TypeSafeClientConfig } from '@typesafe-ai/sdk';
import { z } from 'zod';
import type { JudgeAdapter, JudgeAnswer, JudgeQuestion } from '../../contracts/src/index';

const probability = z.number().finite().min(0).max(1);
const answerSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('choice'),
    choice: z.string(),
    confidence: probability,
    probabilities: z.record(probability),
  }),
  z.object({
    type: z.literal('score'),
    score: z.number().finite(),
    confidence: probability,
    probabilities: z.record(probability),
  }),
  z.object({ type: z.literal('noul'), noul: probability }),
]);
const resultSchema = z.object({
  model: z.string().min(1),
  answers: z.record(answerSchema),
  usage: z.object({
    input_tokens: z.number().int().nonnegative(),
    output_tokens: z.number().int().nonnegative(),
  }),
});

/** Server-only adapter. Cloud transmission must be explicitly enabled by the caller. */
export class JevAdapter implements JudgeAdapter {
  private client: TypeSafeClient;
  constructor(
    private config: {
      apiKey: string;
      model: string;
      cloudAllowed: boolean;
      timeoutMs?: number;
      fetch?: TypeSafeClientConfig['fetch'];
    },
  ) {
    if (!config.apiKey.trim() || !config.model.trim())
      throw new Error('Jev credentials and an explicit model are required');
    if (
      config.timeoutMs !== undefined &&
      (!Number.isSafeInteger(config.timeoutMs) || config.timeoutMs < 1 || config.timeoutMs > 120000)
    )
      throw new Error('Invalid Jev timeout');
    this.client = new TypeSafeClient({
      apiKey: config.apiKey,
      baseURL: 'https://api.typesafe.ai',
      defaultModel: config.model,
      logLevel: 'off',
      retry: { maxRetries: 0 },
      fetch: config.fetch,
    });
  }
  async evaluate(state: string, questions: JudgeQuestion[], signal?: AbortSignal) {
    if (!this.config.cloudAllowed) throw new Error('Cloud data transmission is disabled');
    if (!questions.length || questions.length > 64) throw new Error('Expected 1–64 questions');
    const mapped: Questions = Object.create(null);
    for (const question of questions) {
      if (
        !/^[a-zA-Z][\w-]{0,63}$/.test(question.id) ||
        Object.hasOwn(mapped, question.id) ||
        !question.prompt.trim()
      )
        throw new Error('Invalid or duplicate question');
      if (question.kind === 'choice') {
        if (
          question.options.length < 2 ||
          new Set(question.options).size !== question.options.length ||
          question.options.some((x) => !x.trim())
        )
          throw new Error('Invalid choice options');
        mapped[question.id] = {
          type: 'choice',
          instructions: question.prompt,
          criteria: Object.fromEntries(question.options.map((x) => [x, null])),
        };
      } else if (question.kind === 'score') {
        if (
          question.levels.length < 2 ||
          question.levels.some((value, index) => value !== index) ||
          question.descriptions?.length !== question.levels.length ||
          question.descriptions.some((x) => !x.trim())
        )
          throw new Error(
            'Score requires consecutive zero-based levels and a description for every level',
          );
        mapped[question.id] = {
          type: 'score',
          instructions: question.prompt,
          criteria: question.descriptions as [string, string, ...string[]],
        };
      } else mapped[question.id] = { type: 'noul', instructions: question.prompt };
    }
    // A deliberately conservative byte ceiling, not an exact tokenizer or a claim about the model window.
    if (Buffer.byteLength(JSON.stringify({ state, questions: mapped }), 'utf8') > 30000)
      throw new Error('Jev request exceeds the local 30 KB data limit');
    const deadline = AbortSignal.timeout(this.config.timeoutMs ?? 15000);
    const result = resultSchema.parse(
      await this.client.systemOne(
        { state, questions: mapped, model: this.config.model },
        {
          signal: signal ? AbortSignal.any([signal, deadline]) : deadline,
          retry: { maxRetries: 0 },
        },
      ),
    );
    if (Object.keys(result.answers).length !== questions.length)
      throw new Error('Unexpected Jev answer set');
    const answers: JudgeAnswer[] = questions.map((question) => {
      const answer = result.answers[question.id];
      if (!answer || answer.type !== question.kind) throw new Error('Jev answer type mismatch');
      if (answer.type === 'noul') return { id: question.id, kind: 'noul', noul: answer.noul };
      const keys =
        question.kind === 'choice'
          ? question.options
          : question.kind === 'score'
            ? question.levels.map(String)
            : [];
      if (
        Object.keys(answer.probabilities).length !== keys.length ||
        keys.some((key) => !Object.hasOwn(answer.probabilities, key)) ||
        Math.abs(Object.values(answer.probabilities).reduce((a, b) => a + b, 0) - 1) > 0.01
      )
        throw new Error('Invalid Jev probability distribution');
      if (answer.type === 'choice') {
        if (!keys.includes(answer.choice)) throw new Error('Unknown Jev choice');
        return {
          id: question.id,
          kind: 'choice',
          choice: answer.choice,
          probabilities: answer.probabilities,
          confidence: answer.confidence,
        };
      }
      if (answer.score < 0 || answer.score > keys.length - 1)
        throw new Error('Score outside rubric');
      return {
        id: question.id,
        kind: 'score',
        score: answer.score,
        probabilities: answer.probabilities,
        confidence: answer.confidence,
      };
    });
    return {
      model: result.model,
      answers,
      usage: { inputTokens: result.usage.input_tokens, outputTokens: result.usage.output_tokens },
      requestedModel: this.config.model,
    };
  }
}
