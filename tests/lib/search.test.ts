import {
  buildSearchIndex,
  searchContent,
  collectSearchDocs,
} from '../../src/lib/search';

const docs = [
  {
    id: 's1',
    type: 'scenario' as const,
    title: '试用期被辞退',
    text: '公司说试用期不合格直接让我走。',
  },
  {
    id: 's2',
    type: 'scenario' as const,
    title: '押金不退',
    text: '房东以墙面有划痕为由不退押金。',
  },
  {
    id: 'a1',
    type: 'article' as const,
    title: '劳动合同法 第二十一条',
    text: '在试用期中，除劳动者有本法第三十九条和第四十条第一项、第二项规定的情形外，用人单位不得解除劳动合同。',
  },
];
const index = buildSearchIndex(docs);

test('中文搜索命中标题', () => {
  expect(searchContent(index, '试用期', 'all').map((d) => d.id)).toContain(
    's1',
  );
});

test('按类型过滤', () => {
  expect(
    searchContent(index, '试用期', 'article').map((d) => d.id),
  ).toEqual(['a1']);
});

test('按主题过滤', () => {
  const themed = [
    { ...docs[0], themeId: 'labor' },
    { ...docs[1], themeId: 'contracts' },
  ];
  const idx = buildSearchIndex(themed);
  expect(
    searchContent(idx, '押金', 'all', { themeId: 'labor' }),
  ).toEqual([]);
  expect(
    searchContent(idx, '押金', 'all', { themeId: 'contracts' }).map(
      (d) => d.id,
    ),
  ).toEqual(['s2']);
});

test('空查询返回空数组', () => {
  expect(searchContent(index, '   ', 'all')).toEqual([]);
});

test('从内容注册表收集文档', () => {
  expect(
    collectSearchDocs().some(
      (d) => d.entityId === 'contract-formation',
    ),
  ).toBe(true);
});

test('真实内容可以建立索引，跨类型同名 id 不冲突', () => {
  expect(() => buildSearchIndex(collectSearchDocs())).not.toThrow();
});

test('场景正文可以被搜索到', () => {
  const realIndex = buildSearchIndex(collectSearchDocs());
  expect(
    searchContent(realIndex, '收据', 'scenario').some(
      (d) => d.entityId === 'contract-formation',
    ),
  ).toBe(true);
});
