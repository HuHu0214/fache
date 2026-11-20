import type { LawArticle, LawFile } from '../src/content/schema';
import { RAW_BASE, type LawSource } from './law-sources';
import {
  chineseNumeralToInt,
  parseLawMarkdown,
} from './lib/parse-law-markdown';

function articleNumber(articleNo: string): number {
  const match = /^第(.+?)条(?:之(.+))?$/.exec(articleNo);
  if (!match) {
    throw new Error(`无法解析条号：${articleNo}`);
  }
  const base = chineseNumeralToInt(match[1]);
  const suffix = match[2] ? chineseNumeralToInt(match[2]) : 0;
  return base * 1000 + suffix;
}

type BuildOptions = {
  duplicate?: 'error' | 'skip';
};

export async function buildLawFile(
  source: LawSource,
  readText: (file: string) => Promise<string>,
  now: Date,
  options: BuildOptions = {},
): Promise<LawFile> {
  const byNumber = new Map<string, LawArticle>();

  for (const file of source.files) {
    const markdown = await readText(file);
    for (const article of parseLawMarkdown(markdown)) {
      if (byNumber.has(article.articleNo)) {
        if (options.duplicate === 'skip') {
          continue;
        }
        throw new Error(`重复条号：${source.id} ${article.articleNo}`);
      }
      byNumber.set(article.articleNo, {
        lawId: source.id,
        articleNo: article.articleNo,
        text: article.text,
        path: article.path,
      });
    }
  }

  const articles = [...byNumber.values()].sort(
    (a, b) => articleNumber(a.articleNo) - articleNumber(b.articleNo),
  );

  return {
    law: {
      id: source.id,
      title: source.title,
      shortTitle: source.shortTitle,
      effectiveAt: source.effectiveAt,
      sourceUrl: source.sourceUrl,
      importedAt: now.toISOString().slice(0, 10),
      articleCount: articles.length,
      category: source.category,
      categoryOrder: source.categoryOrder,
      note: source.note,
    },
    articles,
  };
}

export async function importLaw(
  source: LawSource,
  fetchText: (url: string) => Promise<string>,
  now: Date,
): Promise<LawFile> {
  return buildLawFile(
    source,
    async (file) => fetchText(`${RAW_BASE}${file}`),
    now,
  );
}
