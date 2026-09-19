import { describe, it, expect, vi } from 'vitest';
import { JevAdapter } from '../packages/judge/src/index';
const question = {
  id: 'route',
  kind: 'choice' as const,
  prompt: 'Choose a route',
  options: ['local', 'cloud'],
};
const body = {
  model: 'fixture-model',
  answers: {
    route: {
      type: 'choice',
      choice: 'local',
      confidence: 0.8,
      probabilities: { local: 0.8, cloud: 0.2 },
    },
  },
  usage: { input_tokens: 12, output_tokens: 5 },
};
const setup = (value: unknown = body, cloudAllowed = true) => {
  const fetch = vi.fn(
    async () =>
      new Response(JSON.stringify(value), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  );
  return {
    fetch,
    adapter: new JevAdapter({
      apiKey: 'fixture-only',
      model: 'fixture-model',
      cloudAllowed,
      fetch,
    }),
  };
};
describe('Jev boundary', () => {
  it('sends an explicit model and returns observed usage', async () => {
    const { adapter, fetch } = setup();
    const result = await adapter.evaluate('synthetic state', [question]);
    expect(result.usage.inputTokens).toBe(12);
    expect(result.answers[0]).toMatchObject({ kind: 'choice', choice: 'local' });
    expect(fetch).toHaveBeenCalledOnce();
  });
  it('blocks cloud requests before touching the transport', async () => {
    const { adapter, fetch } = setup(body, false);
    await expect(adapter.evaluate('private', [question])).rejects.toThrow('disabled');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects oversized state and duplicate questions before dispatch', async () => {
    const { adapter, fetch } = setup();
    await expect(adapter.evaluate('中'.repeat(11000), [question])).rejects.toThrow('30 KB');
    await expect(adapter.evaluate('', [question, question])).rejects.toThrow('duplicate');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects unrecognized probability labels', async () => {
    const { adapter } = setup({
      ...body,
      answers: { route: { ...body.answers.route, probabilities: { local: 0.8, invented: 0.2 } } },
    });
    await expect(adapter.evaluate('', [question])).rejects.toThrow('distribution');
  });
  it('preserves fractional scores and does not invent noul confidence', async () => {
    const { adapter } = setup({
      ...body,
      answers: {
        score: {
          type: 'score',
          score: 0.25,
          confidence: 0.75,
          probabilities: { '0': 0.75, '1': 0.25 },
        },
        relevant: { type: 'noul', noul: 0.7 },
      },
    });
    const result = await adapter.evaluate('', [
      {
        id: 'score',
        kind: 'score',
        prompt: 'Grade evidence',
        levels: [0, 1],
        descriptions: ['absent', 'present'],
      },
      { id: 'relevant', kind: 'noul', prompt: 'Relevant?' },
    ]);
    expect(result.answers[0]).toMatchObject({ score: 0.25 });
    expect(result.answers[1]).toEqual({ id: 'relevant', kind: 'noul', noul: 0.7 });
  });
  it('does not automatically retry potentially billable failures', async () => {
    const fetch = vi.fn(async () => new Response('failure', { status: 503 }));
    const adapter = new JevAdapter({
      apiKey: 'fixture-only',
      model: 'fixture-model',
      cloudAllowed: true,
      fetch,
    });
    await expect(adapter.evaluate('', [question])).rejects.toThrow();
    expect(fetch).toHaveBeenCalledOnce();
  });
});
