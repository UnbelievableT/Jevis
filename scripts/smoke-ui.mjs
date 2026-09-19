import { chromium, expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
const browser = await chromium.launch({
  headless: true,
  channel: process.env.JEVIS_BROWSER_CHANNEL ?? 'chrome',
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const out = new URL('../docs/screenshots/', import.meta.url);
await mkdir(out, { recursive: true });
const shot = async (name) => {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: new URL(name, out).pathname,
    fullPage: true,
    animations: 'disabled',
  });
};
try {
  await page.goto('http://127.0.0.1:5174');
  await shot('website-desktop.png');
  await page.goto('http://127.0.0.1:5173');
  await shot('workbench-empty.png');
  const token =
    process.env.JEVIS_TOKEN ??
    (await readFile(new URL('../.jevis/token', import.meta.url), 'utf8')).trim();
  await page.getByLabel('本地连接令牌').fill(token);
  await page.getByRole('button', { name: '连接', exact: true }).click();
  await page.getByText('本地服务已连接').waitFor();
  await page.getByRole('button', { name: '新建工作流' }).click();
  await page.getByLabel('工作流名称').fill('Jevis 框架验收 · 协作流程');
  await page
    .getByLabel('目标与验收条件')
    .fill('验证规划、实现、检查和验收之间的依赖流转。本任务为演示，不修改真实仓库。');
  await page.getByRole('button', { name: '创建演示工作流' }).click();
  await page.getByRole('button', { name: '启动演示' }).click();
  await page.getByRole('button', { name: '模拟下一步' }).click();
  await page.getByText('1 / 4 个工作单元完成').waitFor();
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  await page.getByText('已暂停', { exact: true }).waitFor();
  await page.reload();
  await page.getByText('已暂停', { exact: true }).waitFor();
  await page.getByRole('button', { name: '继续', exact: true }).click();
  await expect(page.locator('[data-testid="rf__node-spec"]')).toBeVisible();
  await shot('workbench-desktop.png');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: '模拟下一步' }).click();
  await page.getByText('待验收', { exact: true }).waitFor();
  await page.getByRole('button', { name: '模拟验收' }).click();
  await expect(page.locator('.status-completed')).toHaveText('已完成');
  await page.getByRole('button', { name: '模型与执行器' }).click();
  await page.getByText('Codex', { exact: true }).waitFor();
  await shot('models-desktop.png');
  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('http://127.0.0.1:5174');
    await shot('website-' + width + '.png');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:5175');
  await page.getByLabel('本地连接令牌').fill(token);
  await page.getByRole('button', { name: '连接', exact: true }).click();
  await page.getByText('本地服务已连接').waitFor();
  await expect(page.getByLabel('任务依赖列表')).toBeVisible();
  await shot('mobile-workbench.png');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  console.log(
    'UI smoke passed: create/start/advance/pause/reload/resume/verify; desktop graph; mobile list; 390/768px overflow; zero page errors.',
  );
} finally {
  await browser.close();
}
