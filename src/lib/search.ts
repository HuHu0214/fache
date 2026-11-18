import MiniSearch from 'minisearch';
import {
  getArticles,
  getKnowledgePoints,
  getLaws,
  getScenarios,
  getThemes,
} from '../content/registry';

export type SearchDoc = {
  id: string;
  type: 'scenario' | 'concept' | 'article';
  title: string;
  text: string;
  themeId?: string;
  lawId?: string;
  articleNo?: string;
};

export type SearchFilter = 'all' | 'scenario' | 'concept' | 'article';

const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });

export function tokenizeZh(text: string): string[] {
  return Array.from(segmenter.segment(text))
    .filter((part) => part.isWordLike)
    .map((part) => part.segment.toLowerCase());
}

export function collectSearchDocs(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const theme of getThemes()) {
    for (const scenario of getScenarios(theme.id)) {
      docs.push({
        id: scenario.meta.id,
        type: 'scenario',
        title: scenario.meta.title,
        text: `${scenario.meta.hook} ${scenario.meta.thinkPrompt ?? ''}`,
        themeId: theme.id,
      });
    }
  }

  for (const kp of getKnowledgePoints()) {
    docs.push({
      id: kp.meta.id,
      type: 'concept',
      title: kp.meta.title,
      text: kp.meta.oneLiner,
      themeId: kp.meta.themeId,
    });
  }

  for (const law of getLaws()) {
    for (const article of getArticles(law.id)) {
      docs.push({
        id: `${law.id}:${article.articleNo}`,
        type: 'article',
        title: `${law.shortTitle} ${article.articleNo}`,
        text: article.text,
        lawId: law.id,
        articleNo: article.articleNo,
      });
    }
  }

  return docs;
}

export function buildSearchIndex(
  docs: SearchDoc[],
): MiniSearch<SearchDoc> {
  const index = new MiniSearch<SearchDoc>({
    fields: ['title', 'text'],
    storeFields: [
      'id',
      'type',
      'title',
      'text',
      'themeId',
      'lawId',
      'articleNo',
    ],
    tokenize: tokenizeZh,
    searchOptions: {
      boost: { title: 3 },
      prefix: true,
      fuzzy: 0.2,
    },
  });
  index.addAll(docs);
  return index;
}

export function searchContent(
  index: MiniSearch<SearchDoc>,
  query: string,
  filter: SearchFilter,
  opts: { themeId?: string; limit?: number } = {},
): SearchDoc[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const limit = opts.limit ?? 20;
  const results: SearchDoc[] = [];

  for (const result of index.search(trimmed)) {
    const doc = result as unknown as SearchDoc;
    if (filter !== 'all' && doc.type !== filter) {
      continue;
    }
    if (opts.themeId && doc.themeId !== opts.themeId) {
      continue;
    }
    results.push({
      id: doc.id,
      type: doc.type,
      title: doc.title,
      text: doc.text,
      themeId: doc.themeId,
      lawId: doc.lawId,
      articleNo: doc.articleNo,
    });
    if (results.length >= limit) {
      break;
    }
  }

  return results;
}
