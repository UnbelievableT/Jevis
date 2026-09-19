import { mkdir, cp, access } from 'node:fs/promises';
for (const app of ['desktop', 'web', 'mobile']) {
  const to = new URL('../apps/' + app + '/public/brand/', import.meta.url);
  await mkdir(to, { recursive: true });
  for (const file of ['logo.png', 'hero.png', 'empty-state.png']) {
    const from = new URL('../assets/brand/' + file, import.meta.url);
    try {
      await access(from);
      await cp(from, new URL(file, to));
    } catch {
      throw new Error('Missing generated brand asset: ' + file);
    }
  }
}
