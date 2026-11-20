import { extractMdxText } from '../../src/content/mdx-text';

test('去掉 frontmatter、组件标签和 markdown 符号', () => {
  const source = `---
id: x
title: 标题
---

# 大标题

<Steps><Step title="第一步">正文**重点**</Step></Steps>

<Callout type="tip">提示</Callout>
`;
  const text = extractMdxText(source);
  expect(text).toContain('正文');
  expect(text).toContain('提示');
  expect(text).not.toContain('id: x');
  expect(text).not.toContain('<');
});
