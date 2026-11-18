import remarkFrontmatter from 'remark-frontmatter';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { parse as parseYaml } from 'yaml';
import type { ArticleRef } from '../../src/content/schema';

type Attribute = {
  type: string;
  name: string;
  value?: unknown;
};

type AstNode = {
  type: string;
  name?: string;
  attributes?: Attribute[];
  value?: string;
};

export type MdxScan = {
  frontmatter: Record<string, unknown>;
  articleRefs: ArticleRef[];
  conceptLinks: string[];
  rawArticleMentions: string[];
};

const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkMdx);

function readAttribute(node: AstNode, name: string): string | undefined {
  const attribute = node.attributes?.find((item) => item.name === name);
  if (!attribute) {
    return undefined;
  }
  if (typeof attribute.value !== 'string') {
    throw new Error(
      `<${node.name}> 的 ${name} 属性必须是字符串字面量`,
    );
  }
  return attribute.value;
}

export function scanMdx(source: string): MdxScan {
  const tree = processor.parse(source) as unknown as AstNode;
  let frontmatter: Record<string, unknown> = {};
  const articleRefs: ArticleRef[] = [];
  const conceptLinks: string[] = [];
  const rawArticleMentions: string[] = [];

  visit(tree as never, (node) => {
    const current = node as unknown as AstNode;

    if (current.type === 'yaml' && typeof current.value === 'string') {
      const parsed = parseYaml(current.value);
      frontmatter =
        parsed !== null && typeof parsed === 'object'
          ? (parsed as Record<string, unknown>)
          : {};
      return;
    }

    if (current.type === 'text' && typeof current.value === 'string') {
      const matches = current.value.match(
        /第[一二三四五六七八九十百千零〇两]+条/g,
      );
      if (matches) {
        rawArticleMentions.push(...matches);
      }
      return;
    }

    if (
      current.type !== 'mdxJsxFlowElement' &&
      current.type !== 'mdxJsxTextElement'
    ) {
      return;
    }

    if (current.name === 'ArticleRef') {
      const lawId = readAttribute(current, 'law');
      const articleNo = readAttribute(current, 'no');
      if (!lawId || !articleNo) {
        throw new Error('<ArticleRef> 缺少 law 或 no 属性');
      }
      articleRefs.push({ lawId, articleNo });
    }

    if (current.name === 'ConceptLink') {
      const id = readAttribute(current, 'id');
      if (!id) {
        throw new Error('<ConceptLink> 缺少 id 属性');
      }
      conceptLinks.push(id);
    }
  });

  return { frontmatter, articleRefs, conceptLinks, rawArticleMentions };
}
