import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium');
  await page.addInitScript(() => {
    localStorage.setItem('tutorialSeen', '1');
  });
  await page.goto('http://localhost:5173');
  await page.waitForSelector('canvas');
  await page.waitForFunction(() => (window as any).cubes !== undefined);
});

test('creates cube on click', async ({ page }) => {
  const initial = await page.evaluate(() => (window as any).cubes.length);
  await page.click('canvas');
  const after = await page.evaluate(() => (window as any).cubes.length);
  expect(after).toBe(initial + 1);
});

test('dragging a cube changes its position', async ({ page }) => {
  test.fixme(true, 'Pointer dragging not supported in this environment');
});

test('rotates cube with R key and updates params', async ({ page }) => {
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;
  await page.mouse.click(x, y);
  await page.waitForTimeout(50);
  const initial = await page.evaluate(() => {
    const cube = (window as any).cubes[0];
    return {
      rot: cube.mesh.rotation.y,
      freq: cube.mesh.userData.osc.frequency.value,
    };
  });
  await page.mouse.move(x, y);
  await page.keyboard.down('r');
  await page.mouse.move(x + 100, y, { steps: 10 });
  await page.keyboard.up('r');
  await page.waitForTimeout(50);
  const final = await page.evaluate(() => {
    const cube = (window as any).cubes[0];
    return {
      rot: cube.mesh.rotation.y,
      freq: cube.mesh.userData.osc.frequency.value,
    };
  });
  expect(Math.abs(final.rot - initial.rot)).toBeGreaterThan(0.01);
  expect(Math.abs(final.freq - initial.freq)).toBeGreaterThan(0.1);
});

test('deletes cube with Delete key and updates connections', async ({ page }) => {
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;
  await page.mouse.click(x - 40, y);
  await page.selectOption('#cubeType', 'output');
  await page.mouse.click(x - 20, y);
  const linesBefore = await page.evaluate(() =>
    (window as any).scene.children.filter((o: any) => o.type === 'Line').length,
  );
  expect(linesBefore).toBeGreaterThan(0);
  await page.keyboard.press('Delete');
  await page.waitForTimeout(50);
  const cubeCount = await page.evaluate(() => (window as any).cubes.length);
  const linesAfter = await page.evaluate(() =>
    (window as any).scene.children.filter((o: any) => o.type === 'Line').length,
  );
  expect(cubeCount).toBe(1);
  expect(linesAfter).toBe(0);
});

