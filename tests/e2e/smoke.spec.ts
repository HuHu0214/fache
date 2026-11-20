import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('fajing.disclaimer', '1');
  });
});

test('从首页学一个场景并加入复习', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /合同/ }).first().click();
  await page.getByRole('link', { name: /口头说好的事/ }).click();
  await page.getByRole('button', { name: /展开答案/ }).click();
  await page.getByRole('button', { name: '大概懂了' }).click();
  await expect(page.getByText('已加入复习')).toBeVisible();
  await page.getByRole('link', { name: '复习' }).click();
  await expect(page.getByText(/今天没有要复习的/)).toBeVisible();
});

test('到期卡片可在复习页完成自评', async ({ page }) => {
  await page.goto('/scenario/contract-formation');
  await page.getByRole('button', { name: /展开答案/ }).click();
  await page.getByRole('button', { name: '大概懂了' }).click();
  await expect(page.getByText('已加入复习')).toBeVisible();

  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('fajing');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const tx = database.transaction('progress', 'readwrite');
        const store = tx.objectStore('progress');
        const get = store.get('contract-formation');
        get.onerror = () => reject(get.error);
        get.onsuccess = () => {
          const record = get.result as
            | { due?: string; card?: { due?: Date } }
            | undefined;
          if (!record) {
            return;
          }
          const past = new Date(Date.now() - 86_400_000);
          record.due = past.toISOString();
          if (record.card) {
            record.card.due = past;
          }
          store.put(record);
        };
        tx.oncomplete = () => {
          database.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
  });

  await page.goto('/review');
  await expect(
    page.getByRole('heading', { name: '合同成立' }),
  ).toBeVisible();
  await page.getByRole('button', { name: '显示答案' }).click();
  await page.getByRole('button', { name: '很熟' }).click();
  await expect(page.getByText(/今天没有要复习的/)).toBeVisible();
});

test('笔记和收藏在刷新后保留', async ({ page }) => {
  await page.goto('/concept/contract-formation');
  await page.getByRole('textbox').fill('刷新后还在');
  await expect(page.getByText('已保存')).toBeVisible();
  await page.getByRole('button', { name: '收藏' }).click();
  await expect(
    page.getByRole('button', { name: '已收藏' }),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByRole('textbox')).toHaveValue('刷新后还在');
  await expect(
    page.getByRole('button', { name: '已收藏' }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('深色模式切换生效', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '切换深色模式' }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    'dark',
  );
});

test('360px 下无横向滚动', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await page.goto('/scenario/contract-formation');
  await page.getByRole('button', { name: /展开答案/ }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await page.screenshot({
    path: 'test-results/scenario-360.png',
    fullPage: true,
  });
});
