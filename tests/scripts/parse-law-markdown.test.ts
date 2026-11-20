import {
  parseLawMarkdown,
  chineseNumeralToInt,
} from '../../scripts/lib/parse-law-markdown';

const src = `# 中华人民共和国劳动合同法

## 第一章　总则

**第一条**　为了完善劳动合同制度。

**第二条**　中华人民共和国境内的企业、个体经济组织等组织适用本法。

国家机关、事业单位、社会团体和与其建立劳动关系的劳动者，依照本法执行。

## 第二章　劳动合同的订立

**第十条**　建立劳动关系，应当订立书面劳动合同。
`;

test('解析条号、正文、章节路径', () => {
  const articles = parseLawMarkdown(src);
  expect(articles).toHaveLength(3);
  expect(articles[0].articleNo).toBe('第一条');
  expect(articles[1].text).toContain('国家机关、事业单位');
  expect(articles[1].path).toEqual(['第一章　总则']);
  expect(articles[2].articleNo).toBe('第十条');
});

test('民法典的编作为路径第一级', () => {
  const md = `# 第三编　合同

## 第一分编　通则

### 第一章　一般规定

**第四百六十三条**　本编调整因合同产生的民事关系。
`;
  expect(parseLawMarkdown(md)[0].path).toEqual([
    '第三编　合同',
    '第一分编　通则',
    '第一章　一般规定',
  ]);
});

test('支持条号之一', () => {
  const md = `## 第一章　总则

**第十七条**　前条。

**第十七条之一**　已满七十五周岁的人故意犯罪的，可以从轻或者减轻处罚。
`;
  const articles = parseLawMarkdown(md);
  expect(articles.map((article) => article.articleNo)).toEqual([
    '第十七条',
    '第十七条之一',
  ]);
});

test('中文数字转整数', () => {
  expect(chineseNumeralToInt('一')).toBe(1);
  expect(chineseNumeralToInt('十一')).toBe(11);
  expect(chineseNumeralToInt('二十')).toBe(20);
  expect(chineseNumeralToInt('一百零一')).toBe(101);
  expect(chineseNumeralToInt('一千二百六十')).toBe(1260);
});
