import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LawArticle, LawFile } from '../src/content/schema';
import {
  LAW_SOURCES,
  RAW_BASE,
  type LawSource,
} from './law-sources';
import {
  chineseNumeralToInt,
  parseLawMarkdown,
} from './lib/parse-law-markdown';

function articleNumber(articleNo: string): number {
  return chineseNumeralToInt(articleNo.replace(/^第|条$/g, ''));
}

export async function importLaw(
  source: LawSource,
  fetchText: (url: string) => Promise<string>,
  now: Date,
): Promise<LawFile> {
  const byNumber = new Map<string, LawArticle>();

  for (const file of source.files) {
    const markdown = await fetchText(`${RAW_BASE}${file}`);
    for (const article of parseLawMarkdown(markdown)) {
      if (byNumber.has(article.articleNo)) {
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
      note: source.note,
    },
    articles,
  };
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`下载失败 ${response.status}：${url}`);
  }
  return response.text();
}

async function main() {
  const outDir = path.resolve('content/laws');
  await mkdir(outDir, { recursive: true });

  for (const source of LAW_SOURCES) {
    const file = await importLaw(source, fetchText, new Date());
    await writeFile(
      path.join(outDir, `${source.id}.json`),
      `${JSON.stringify(file, null, 2)}\n`,
      'utf8',
    );
    console.log(`${source.id}: ${file.law.articleCount} 条`);
  }
}

const isMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  await main();
}
