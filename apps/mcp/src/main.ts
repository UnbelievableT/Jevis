import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JevisClient } from '../../../packages/client/src/index';
const token =
  process.env.JEVIS_TOKEN ??
  readFileSync(resolve(process.env.JEVIS_DATA_DIR ?? '.jevis', 'token'), 'utf8').trim();
const client = new JevisClient(process.env.JEVIS_URL ?? 'http://127.0.0.1:4317', token);
const server = new McpServer({ name: 'jevis', version: '0.1.0' });
const wrap = async (fn: () => Promise<unknown>) => {
  try {
    return { content: [{ type: 'text' as const, text: JSON.stringify(await fn()) }] };
  } catch (e) {
    return {
      isError: true,
      content: [{ type: 'text' as const, text: e instanceof Error ? e.message : 'Request failed' }],
    };
  }
};
server.registerTool(
  'jevis_list_tasks',
  {
    description: 'Read local Jevis tasks. Foundation currently supports demo tasks only.',
    annotations: { readOnlyHint: true },
  },
  () => wrap(() => client.list()),
);
server.registerTool(
  'jevis_get_task',
  {
    description: 'Read a task and its persisted state.',
    inputSchema: { id: z.string().min(1) },
    annotations: { readOnlyHint: true },
  },
  ({ id }) => wrap(() => client.get(id)),
);
await server.connect(new StdioServerTransport());
