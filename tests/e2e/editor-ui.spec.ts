import { expect, test } from '@playwright/test';

test('background settings can be scrolled to the preview', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Background & Layout' }).click();
  const panel = page.locator('#rc-tabs-1-panel-preview > div');
  await expect(panel).toBeVisible();
  const before = await panel.evaluate(element => element.scrollTop);
  await panel.hover();
  await page.mouse.wheel(0, 900);
  await expect.poll(() => panel.evaluate(element => element.scrollTop)).toBeGreaterThan(before);
  await expect(page.getByText('This is a scaled preview.')).toBeVisible();
});

test('editor and variable form open without disconnected form or hydration warnings', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', message => {
    if (/Instance created by .useForm.|Tiptap Error: SSR has been detected/i.test(message.text())) problems.push(message.text());
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'New Variable' }).click();
  await expect(page.getByText('Preview placeholder token:')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  expect(problems).toEqual([]);
});
