import { test, expect } from '@playwright/test';

test('creates cube on click', async ({ page }) => {
  await page.goto('http://localhost:5173');
  const initial = await page.evaluate(() => (window as any).cubes.length);
  await page.click('canvas');
  const after = await page.evaluate(() => (window as any).cubes.length);
  expect(after).toBe(initial + 1);
});

