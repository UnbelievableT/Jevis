import { z } from 'zod';
export const configSchema = z.object({
  host: z.literal('127.0.0.1').default('127.0.0.1'),
  port: z.coerce.number().int().min(1024).max(65535).default(4317),
  dataDir: z.string(),
  mode: z.literal('local').default('local'),
});
export const brand = {
  name: 'Jevis',
  domain: 'jevis.xyz',
  tagline: '让不同的智能，完成同一个目标。',
} as const;
