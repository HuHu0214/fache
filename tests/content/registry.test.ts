import {
  getThemes,
  getScenario,
  getKnowledgePoint,
  getArticle,
  getLaws,
  loadArticles,
} from '../../src/content/registry';

test('加载合同主题', () => {
  expect(getThemes().map((t) => t.id)).toContain('contracts');
});

test('场景带 themeId 与 MDX 组件', () => {
  const entry = getScenario('contract-formation');
  expect(entry?.meta.themeId).toBe('contracts');
  expect(entry?.Content).toBeTruthy();
});

test('知识点可读取', () => {
  expect(getKnowledgePoint('contract-formation')?.meta.title).toBeTruthy();
});

test('法条可读取且原文正确', () => {
  expect(
    getArticle('civil-code', '第四百六十三条')?.text,
  ).toContain('本编调整因合同产生的民事关系');
});

test('法律库收录全部法律，非核心法律按需加载', async () => {
  expect(getLaws().length).toBeGreaterThan(300);
  const articles = await loadArticles('constitution');
  expect(articles.length).toBeGreaterThan(100);
  expect(articles[0]?.articleNo).toBe('第一条');
});
