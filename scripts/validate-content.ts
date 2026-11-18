import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  knowledgePointFrontmatterSchema,
  lawFileSchema,
  scenarioFrontmatterSchema,
  themeSchema,
  type ArticleRef,
  type KnowledgePointFrontmatter,
  type Law,
  type ScenarioFrontmatter,
  type Theme,
} from '../src/content/schema';
import { scanMdx } from './lib/parse-mdx';

export type ValidationIssue = {
  file: string;
  message: string;
};

type ScenarioRecord = {
  file: string;
  themeId: string;
  data: ScenarioFrontmatter;
  refs: ArticleRef[];
  links: string[];
  rawMentions: string[];
};

type ConceptRecord = {
  file: string;
  themeId: string;
  data: KnowledgePointFrontmatter;
  refs: ArticleRef[];
  links: string[];
  rawMentions: string[];
};

function walk(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function relativePath(rootDir: string, file: string): string {
  return path.relative(rootDir, file).split(path.sep).join('/');
}

function messageOf(error: unknown): string {
  if (error && typeof error === 'object' && 'issues' in error) {
    const issues = (
      error as {
        issues: Array<{ path: Array<string | number>; message: string }>;
      }
    ).issues;
    return issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
  }
  return error instanceof Error ? error.message : String(error);
}

export function validateContent(
  rootDir: string,
  opts: { strict?: boolean } = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const contentDir = path.join(rootDir, 'content');
  if (!existsSync(contentDir)) {
    return issues;
  }

  const add = (file: string, message: string) => {
    issues.push({ file, message });
  };

  const idOwners = new Map<string, string>();
  const claimId = (file: string, id: string) => {
    const owner = idOwners.get(id);
    if (owner) {
      add(file, `重复 id：${id}（已被 ${owner} 使用）`);
      return;
    }
    idOwners.set(id, file);
  };

  const themes: Theme[] = [];
  const scenarios: ScenarioRecord[] = [];
  const concepts: ConceptRecord[] = [];
  const laws = new Map<
    string,
    { law: Law; articleNos: Set<string> }
  >();

  const files = walk(contentDir);

  for (const file of files) {
    const relative = relativePath(rootDir, file);

    if (path.basename(file) === 'theme.json') {
      try {
        const theme = themeSchema.parse(
          JSON.parse(readFileSync(file, 'utf8')),
        );
        themes.push(theme);
        claimId(relative, theme.id);
      } catch (error) {
        add(relative, `主题解析失败：${messageOf(error)}`);
      }
      continue;
    }

    if (
      file.endsWith('.json') &&
      relative.startsWith('content/laws/')
    ) {
      try {
        const lawFile = lawFileSchema.parse(
          JSON.parse(readFileSync(file, 'utf8')),
        );
        claimId(relative, lawFile.law.id);
        laws.set(lawFile.law.id, {
          law: lawFile.law,
          articleNos: new Set(
            lawFile.articles.map((article) => article.articleNo),
          ),
        });
      } catch (error) {
        add(relative, `法条库解析失败：${messageOf(error)}`);
      }
    }
  }

  for (const file of files) {
    if (!file.endsWith('.mdx')) {
      continue;
    }

    const relative = relativePath(rootDir, file);
    const parts = relative.split('/');
    if (
      parts[0] !== 'content' ||
      parts[1] !== 'themes' ||
      parts.length < 5
    ) {
      continue;
    }

    const themeId = parts[2];
    const kind = parts[3];

    let scan: ReturnType<typeof scanMdx>;
    try {
      scan = scanMdx(readFileSync(file, 'utf8'));
    } catch (error) {
      add(relative, `MDX 解析失败：${messageOf(error)}`);
      continue;
    }

    if (kind === 'scenarios') {
      try {
        const data = scenarioFrontmatterSchema.parse(scan.frontmatter);
        claimId(relative, data.id);
        scenarios.push({
          file: relative,
          themeId,
          data,
          refs: [...data.articleRefs, ...scan.articleRefs],
          links: scan.conceptLinks,
          rawMentions: scan.rawArticleMentions,
        });
      } catch (error) {
        add(relative, `场景解析失败：${messageOf(error)}`);
      }
      continue;
    }

    if (kind === 'concepts') {
      try {
        const data = knowledgePointFrontmatterSchema.parse(
          scan.frontmatter,
        );
        claimId(relative, data.id);
        concepts.push({
          file: relative,
          themeId,
          data,
          refs: [...data.articleRefs, ...scan.articleRefs],
          links: scan.conceptLinks,
          rawMentions: scan.rawArticleMentions,
        });
      } catch (error) {
        add(relative, `知识点解析失败：${messageOf(error)}`);
      }
    }
  }

  const themeIds = new Set(themes.map((theme) => theme.id));
  const kpIds = new Set(concepts.map((concept) => concept.data.id));

  for (const scenario of scenarios) {
    if (!themeIds.has(scenario.themeId)) {
      add(
        scenario.file,
        `主题不存在：${scenario.themeId}`,
      );
    }
    for (const kpId of scenario.data.kpIds) {
      if (!kpIds.has(kpId)) {
        add(scenario.file, `知识点不存在：${kpId}`);
      }
    }
    if (!kpIds.has(scenario.data.primaryKpId)) {
      add(
        scenario.file,
        `主知识点不存在：${scenario.data.primaryKpId}`,
      );
    }
  }

  for (const concept of concepts) {
    if (!themeIds.has(concept.themeId)) {
      add(concept.file, `主题不存在：${concept.themeId}`);
    }
    for (const relatedId of concept.data.relatedKpIds) {
      if (!kpIds.has(relatedId)) {
        add(concept.file, `关联知识点不存在：${relatedId}`);
      }
    }
  }

  for (const holder of [...scenarios, ...concepts]) {
    for (const ref of holder.refs) {
      const law = laws.get(ref.lawId);
      if (!law) {
        add(
          holder.file,
          `法律不存在：${ref.lawId}（引用 ${ref.articleNo}）`,
        );
        continue;
      }
      if (!law.articleNos.has(ref.articleNo)) {
        add(
          holder.file,
          `法条不存在：${ref.lawId} 未收录 ${ref.articleNo}`,
        );
      }
    }

    for (const id of holder.links) {
      if (!kpIds.has(id)) {
        add(holder.file, `ConceptLink 指向不存在的知识点：${id}`);
      }
    }

    for (const mention of holder.rawMentions) {
      add(
        holder.file,
        `[警告] 正文直接提到 ${mention}，请改用 <ArticleRef>`,
      );
    }

    if (opts.strict && holder.data.reviewStatus !== 'checked') {
      add(
        holder.file,
        `reviewStatus 必须为 checked（发布构建）：${holder.data.id}`,
      );
    }
  }

  return issues;
}

if (
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const strict = process.argv.includes('--strict');
  const issues = validateContent(process.cwd(), { strict });
  const errors = issues.filter(
    (issue) => !issue.message.startsWith('[警告]'),
  );

  for (const issue of issues) {
    console.log(`${issue.file}: ${issue.message}`);
  }

  if (errors.length > 0) {
    console.error(
      `内容校验失败：${errors.length} 个错误，${issues.length - errors.length} 个警告`,
    );
    process.exit(1);
  }

  console.log(`内容校验通过：0 个错误，${issues.length} 个警告`);
}
