import { importLaw } from '../../scripts/import-laws';
import type { LawSource } from '../../scripts/law-sources';

const source: LawSource = {
  id: 'labor-contracts-law',
  title: '中华人民共和国劳动合同法',
  shortTitle: '劳动合同法',
  effectiveAt: '2013-07-01',
  sourceUrl: 'https://flk.npc.gov.cn/',
  files: ['a.md', 'b.md'],
};

test('合并多文件并按条号排序', async () => {
  const file = await importLaw(
    source,
    async (url) =>
      url.endsWith('a.md')
        ? '## 第一章　总则\n\n**第二条**　乙。\n'
        : '## 第一章　总则\n\n**第一条**　甲。\n',
    new Date('2026-11-18'),
  );
  expect(file.articles.map((a) => a.articleNo)).toEqual(['第一条', '第二条']);
  expect(file.law.articleCount).toBe(2);
  expect(file.law.importedAt).toBe('2026-11-18');
});

test('同一文件内重复条号报错', async () => {
  const md = '**第一条**　甲。\n\n**第一条**　乙。\n';
  await expect(importLaw(source, async () => md, new Date())).rejects.toThrow(
    '重复条号',
  );
});
