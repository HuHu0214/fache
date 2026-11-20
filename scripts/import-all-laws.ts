import { execFileSync } from 'node:child_process';
import {
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLawFile } from './import-laws';
import type { LawSource } from './law-sources';

const TARBALL_URL =
  'https://codeload.github.com/ImCa0/just-laws/tar.gz/refs/heads/master';
const CACHE_DIR = path.resolve('.cache/just-laws');
const ARCHIVE_PATH = path.resolve('.cache/just-laws.tar.gz');
const OUT_DIR = path.resolve('content/laws');
const SOURCE_URL = 'https://flk.npc.gov.cn/';

export const CATEGORIES = [
  { slug: 'constitution', label: '宪法', order: 0 },
  { slug: 'constitutional-relevance', label: '宪法相关法', order: 1 },
  { slug: 'civil-and-commercial', label: '民法商法', order: 2 },
  { slug: 'administrative', label: '行政法', order: 3 },
  { slug: 'economic', label: '经济法', order: 4 },
  { slug: 'social', label: '社会法', order: 5 },
  { slug: 'criminal-law', label: '刑法', order: 6 },
  { slug: 'procedural', label: '诉讼与非诉讼程序法', order: 7 },
  { slug: 'ecological-environment', label: '生态环境法', order: 8 },
] as const;

const SKIP_DIRS = new Set(['.vuepress', 'MessageBoard', 'category']);

type VersionMeta = {
  title?: string;
  repealedBy?: { title?: string };
  versions?: Array<{
    label?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
  }>;
};

function firstH1(markdown: string): string | undefined {
  const match = /^#\s+(.+)$/m.exec(markdown);
  return match?.[1]?.trim();
}

function normalizeDate(
  year: string,
  month: string,
  day: string,
): string {
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function effectiveDate(text: string): string | undefined {
  const match =
    /(?:自)?\s*(\d{4})年(\d{1,2})月(\d{1,2})日[^。\n]{0,40}?(?:起)?施行/.exec(
      text,
    );
  return match ? normalizeDate(match[1], match[2], match[3]) : undefined;
}

async function listMarkdown(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter(
      (entry) => entry.isFile() && entry.name.endsWith('.md'),
    )
    .map((entry) => entry.name)
    .sort((a, b) => {
      if (a === 'README.md') return -1;
      if (b === 'README.md') return 1;
      return a.localeCompare(b);
    });
}

async function readVersionMeta(
  dir: string,
): Promise<VersionMeta | undefined> {
  try {
    return JSON.parse(
      await readFile(path.join(dir, 'versions.json'), 'utf8'),
    ) as VersionMeta;
  } catch {
    return undefined;
  }
}

async function discoverSources(
  repoRoot: string,
): Promise<LawSource[]> {
  const docsDir = path.join(repoRoot, 'docs');
  const sources: LawSource[] = [];

  for (const category of CATEGORIES) {
    const categoryDir =
      category.slug === 'constitution'
        ? path.join(docsDir, 'constitution')
        : path.join(docsDir, category.slug);

    let lawDirs: string[];
    if (category.slug === 'constitution') {
      lawDirs = (await listMarkdown(categoryDir)).length > 0
        ? [categoryDir]
        : [];
    } else {
      lawDirs = (await readdir(categoryDir, { withFileTypes: true }))
        .filter(
          (entry) =>
            entry.isDirectory() && !SKIP_DIRS.has(entry.name),
        )
        .map((entry) => path.join(categoryDir, entry.name))
        .sort();
    }

    for (const lawDir of lawDirs) {
      const files = await listMarkdown(lawDir);
      if (files.length === 0) {
        continue;
      }

      const markdown = (
        await Promise.all(
          files.map((file) =>
            readFile(path.join(lawDir, file), 'utf8'),
          ),
        )
      ).join('\n');

      const versionMeta = await readVersionMeta(lawDir);
      const title =
        firstH1(markdown) ?? versionMeta?.title ?? '';
      if (!title) {
        console.warn(`跳过无标题目录：${lawDir}`);
        continue;
      }

      const id = path.basename(lawDir);
      if (!/^[a-z][a-z0-9-]*$/.test(id)) {
        console.warn(`跳过非法 id：${lawDir} (${id})`);
        continue;
      }

      const versions = versionMeta?.versions ?? [];
      const currentVersion = versions[versions.length - 1];
      const effectiveAt =
        currentVersion?.effectiveFrom ??
        effectiveDate(markdown) ??
        (/自(?:公布|发布|颁布)之日起施行/.test(markdown)
          ? '公布之日'
          : '未标注');

      const notes: string[] = [];
      if (versionMeta?.repealedBy?.title) {
        notes.push(`已被《${versionMeta.repealedBy.title}》替代`);
      }
      if (currentVersion?.label) {
        notes.push(currentVersion.label);
      }

      sources.push({
        id,
        title,
        shortTitle: title.replace(/^中华人民共和国/, '') || title,
        effectiveAt,
        sourceUrl: SOURCE_URL,
        files: files.map((file) => path.join(lawDir, file)),
        category: category.label,
        categoryOrder: category.order,
        note: notes.length > 0 ? notes.join(' · ') : undefined,
      });
    }
  }

  return sources.sort(
    (a, b) =>
      (a.categoryOrder ?? 99) - (b.categoryOrder ?? 99) ||
      a.title.localeCompare(b.title, 'zh-CN'),
  );
}

async function downloadRepo(): Promise<void> {
  await mkdir(path.dirname(ARCHIVE_PATH), { recursive: true });
  const response = await fetch(TARBALL_URL);
  if (!response.ok) {
    throw new Error(`下载 just-laws 失败：HTTP ${response.status}`);
  }
  await writeFile(
    ARCHIVE_PATH,
    Buffer.from(await response.arrayBuffer()),
  );

  await rm(CACHE_DIR, { recursive: true, force: true });
  await mkdir(CACHE_DIR, { recursive: true });
  execFileSync('tar', [
    '-xzf',
    ARCHIVE_PATH,
    '-C',
    CACHE_DIR,
    '--strip-components=1',
  ]);
}

async function main() {
  const localRoot = process.argv[2];
  if (localRoot) {
    const absolute = path.resolve(localRoot);
    console.log(`使用本地仓库：${absolute}`);
    await importFrom(absolute);
    return;
  }

  console.log('下载 just-laws …');
  await downloadRepo();
  await importFrom(CACHE_DIR);
}

async function importFrom(repoRoot: string) {
  const sources = await discoverSources(repoRoot);
  await mkdir(OUT_DIR, { recursive: true });

  const existing = await readdir(OUT_DIR);
  await Promise.all(
    existing
      .filter((file) => file.endsWith('.json'))
      .map((file) => rm(path.join(OUT_DIR, file))),
  );

  const now = new Date();
  const kept: string[] = [];
  const skipped: string[] = [];
  let articleTotal = 0;

  for (const source of sources) {
    const file = await buildLawFile(
      source,
      (name) => readFile(name, 'utf8'),
      now,
      { duplicate: 'skip' },
    );

    if (file.articles.length === 0) {
      skipped.push(source.title);
      continue;
    }

    await writeFile(
      path.join(OUT_DIR, `${source.id}.json`),
      `${JSON.stringify(file, null, 2)}\n`,
      'utf8',
    );
    kept.push(source.id);
    articleTotal += file.articles.length;
  }

  console.log(
    `已导入 ${kept.length} 部法律，共 ${articleTotal} 条，跳过 ${skipped.length} 个无条文文件。`,
  );
  if (skipped.length > 0) {
    console.log(`无条文：${skipped.join('、')}`);
  }
}

const isMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  await main();
}
