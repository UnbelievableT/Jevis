import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JevisClient } from '../../../packages/client/src/index';
import { JevAdapter } from '../../../packages/judge/src/index';
const [command, ...args] = process.argv.slice(2);
async function main() {
  if (!command || command === 'help') {
    console.log(
      'jevis list | create <title> | show <id> | events <id> | <start|advance|pause|resume|cancel> <id>\njevis judge-check --allow-cloud (sends only a built-in synthetic fixture; requires TYPESAFE_API_KEY and JEVIS_JEV_MODEL)\nJEVIS_URL defaults to http://127.0.0.1:4317. Token uses JEVIS_TOKEN or .jevis/token. Task execution is demo only.',
    );
    return;
  }
  if (command === 'judge-check') {
    const adapter = new JevAdapter({
      apiKey: process.env.TYPESAFE_API_KEY ?? '',
      model: process.env.JEVIS_JEV_MODEL ?? '',
      cloudAllowed: args.includes('--allow-cloud'),
    });
    const result = await adapter.evaluate(
      'Synthetic fixture: The request is to correct a spelling error in a README. No private project data is included.',
      [
        {
          id: 'route',
          kind: 'choice',
          prompt: 'Which role should perform this task?',
          options: ['architect', 'worker'],
        },
      ],
    );
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  const token =
    process.env.JEVIS_TOKEN ??
    readFileSync(resolve(process.env.JEVIS_DATA_DIR ?? '.jevis', 'token'), 'utf8').trim();
  const client = new JevisClient(process.env.JEVIS_URL ?? 'http://127.0.0.1:4317', token);
  let result: unknown;
  if (command === 'list') result = await client.list();
  else if (command === 'create') {
    const title = args.join(' ');
    result = await client.create({ title, goal: title, budgetUsd: 5, mode: 'demo' });
  } else if (command === 'show') result = await client.get(args[0] ?? '');
  else if (command === 'events') result = await client.events(args[0] ?? '');
  else if (['start', 'advance', 'pause', 'resume', 'cancel'].includes(command)) {
    const { task } = await client.get(args[0] ?? '');
    result = await client.command(
      task,
      command as 'start' | 'advance' | 'pause' | 'resume' | 'cancel',
    );
  } else throw new Error('Unknown command; run help');
  console.log(JSON.stringify(result, null, 2));
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
