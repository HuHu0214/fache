import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('fajing.disclaimer', '1');
  });
});

test('标记法条后写入首页艾宾浩斯看板', async ({ page }) => {
  await page.goto('/law/e-commerce-law');
  await expect(
    page.getByRole('heading', { name: '中华人民共和国电子商务法' }),
  ).toBeVisible();

  const mark = page.getByRole('button', {
    name: '标记第一条已学习',
  });
  await mark.click();
  await expect(page.getByText(/第1阶/).first()).toBeVisible();

  await page.reload();
  await expect(page.getByText(/第1阶/).first()).toBeVisible();

  await page.goto('/');
  await expect(page.getByText('电子商务法').first()).toBeVisible();
  await expect(page.getByText('学习曲线')).toBeVisible();
  await expect(page.getByText(/每日宝箱/)).toBeVisible();
  await expect(page.getByText(/连续打卡/)).toBeVisible();
});

test('整部法律可批量标记未学法条', async ({ page }) => {
  await page.goto('/study?mode=whole&law=e-commerce-law');
  await expect(
    page.getByRole('heading', { name: '艾宾浩斯学习台' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /标记全部未学/ }),
  ).toBeVisible();

  await page.getByRole('button', { name: /标记全部未学/ }).click();
  await page.getByRole('button', { name: '确认', exact: true }).click();
  await expect(page.getByText(/已将 89 条未学法条/)).toBeVisible();
  await expect(page.getByText('89/89')).toBeVisible();
});

test('随机抽取遵守法律数量边界', async ({ page }) => {
  await page.goto('/study?mode=random');
  const selects = page.locator('select');
  await selects.nth(0).selectOption('1');
  await selects.nth(1).selectOption('1');
  await page.getByRole('button', { name: '随机抽取' }).click();
  await expect(page.getByText(/本次抽取/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: /已学习|再学一次/ }).first(),
  ).toBeVisible();
});

test('法律库内可以按名称搜索', async ({ page }) => {
  await page.goto('/laws');
  await page.getByRole('searchbox', { name: '搜索法律或法条' }).fill('宪');
  await expect(
    page.getByRole('link', { name: /中华人民共和国宪法/ }),
  ).toBeVisible();
});

test('每日宝箱每天只能开一次', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '开启' }).click();
  await expect(page.getByText(/今日已开启/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: '已领取' }),
  ).toBeDisabled();
});

test('主题切换生效', async ({ page }) => {
  await page.goto('/');
  const initial = await page
    .locator('html')
    .getAttribute('data-theme');
  await page.getByRole('button', { name: '切换深色模式' }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    initial === 'dark' ? 'light' : 'dark',
  );
});

test('复习、笔记、搜索已从导航退役', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('link', { name: '法律', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: '复习' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: '笔记' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: '搜索' }),
  ).toHaveCount(0);
});

test('360px 下法律页无横向滚动', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/law/e-commerce-law');
  await expect(
    page.getByText(/为了保障电子商务各方主体的合法权益/),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await page.screenshot({
    path: 'test-results/law-360.png',
    fullPage: true,
  });
});
