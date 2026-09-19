import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { ZodError } from 'zod';
import { Store } from '../../../packages/storage/src/index';
import { DomainError } from '../../../packages/core/src/index';
import { commandSchema, createTaskSchema } from '../../../packages/contracts/src/index';
import { supplies } from '../../../packages/adapters/src/index';
const allowedOrigins = new Set([
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5175',
  'http://localhost:5175',
  'tauri://localhost',
  'http://tauri.localhost',
  'https://tauri.localhost',
]);
function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(JSON.stringify(data));
}
async function body(req: IncomingMessage) {
  let text = '';
  for await (const chunk of req) {
    text += chunk.toString();
    if (Buffer.byteLength(text) > 65536)
      throw new DomainError('Request body too large', 'body_too_large', 413);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new DomainError('Invalid JSON', 'invalid_json', 400);
  }
}
export function createApi(store: Store, token: string) {
  if (token.length < 32) throw new Error('Daemon token must be at least 32 characters');
  const server = createServer(async (req, res) => {
    try {
      const host = (req.headers.host ?? '').split(':')[0];
      if (!['127.0.0.1', 'localhost'].includes(host))
        throw new DomainError('Invalid host', 'forbidden_host', 403);
      const origin = req.headers.origin;
      if (origin && !allowedOrigins.has(origin))
        throw new DomainError('Origin not allowed', 'forbidden_origin', 403);
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
      }
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Headers':
            'Authorization, Content-Type, Idempotency-Key, Last-Event-ID',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        });
        res.end();
        return;
      }
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      const route = url.pathname;
      if (route === '/api/v1/health' && req.method === 'GET') {
        json(res, 200, { status: 'ok', version: '0.1.0', mode: 'foundation-demo' });
        return;
      }
      const authorization = req.headers.authorization ?? '';
      const expected = 'Bearer ' + token;
      if (
        Buffer.byteLength(authorization) !== Buffer.byteLength(expected) ||
        !timingSafeEqual(Buffer.from(authorization), Buffer.from(expected))
      )
        throw new DomainError('Connect with your local daemon token', 'unauthorized', 401);
      if (route === '/api/v1/supplies' && req.method === 'GET') {
        json(res, 200, { supplies });
        return;
      }
      if (route === '/api/v1/tasks' && req.method === 'GET') {
        json(res, 200, { tasks: store.list() });
        return;
      }
      if (route === '/api/v1/events' && req.method === 'GET') {
        const after = Number(url.searchParams.get('after') ?? req.headers['last-event-id'] ?? 0);
        if (!Number.isSafeInteger(after) || after < 0)
          throw new DomainError('Invalid event cursor', 'invalid_cursor', 400);
        const taskId = url.searchParams.get('taskId') ?? undefined;
        if (req.headers.accept?.includes('text/event-stream')) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
          });
          let cursor = after;
          const send = () => {
            try {
              const events = store.events(cursor, taskId);
              for (const event of events) {
                res.write('id: ' + event.sequence + '\ndata: ' + JSON.stringify(event) + '\n\n');
                cursor = event.sequence;
              }
              if (!events.length) res.write(': heartbeat\n\n');
            } catch {
              res.end();
            }
          };
          send();
          const timer = setInterval(send, 1000);
          res.on('close', () => clearInterval(timer));
          return;
        }
        json(res, 200, { events: store.events(after, taskId) });
        return;
      }
      const match = route.match(/^\/api\/v1\/tasks\/([^/]+)(\/commands)?$/);
      if (match && !match[2] && req.method === 'GET') {
        json(res, 200, { task: store.get(match[1]) });
        return;
      }
      if (req.method === 'POST' && (route === '/api/v1/tasks' || match?.[2])) {
        if (!req.headers['content-type']?.startsWith('application/json'))
          throw new DomainError('Expected application/json', 'invalid_content_type', 415);
        const key = req.headers['idempotency-key'];
        if (typeof key !== 'string' || !/^[a-zA-Z0-9_-]{8,128}$/.test(key))
          throw new DomainError(
            'Idempotency-Key required (8–128 letters, digits, hyphens or underscores)',
            'invalid_key',
            400,
          );
        const input = await body(req);
        if (route === '/api/v1/tasks') {
          json(res, 201, { task: store.create(createTaskSchema.parse(input), key) });
          return;
        }
        json(res, 200, { task: store.command(match![1], commandSchema.parse(input), key) });
        return;
      }
      throw new DomainError('Endpoint not found', 'not_found', 404);
    } catch (error) {
      if (res.headersSent) {
        res.end();
        return;
      }
      if (error instanceof DomainError) {
        json(res, error.status, { error: { code: error.code, message: error.message } });
        return;
      }
      if (error instanceof ZodError) {
        json(res, 400, {
          error: { code: 'validation_error', message: 'Invalid request', issues: error.issues },
        });
        return;
      }
      json(res, 500, {
        error: {
          code: 'internal_error',
          message:
            'Internal error. Task state was not acknowledged; retry with the same idempotency key.',
        },
      });
    }
  });
  server.requestTimeout = 15000;
  return server;
}
