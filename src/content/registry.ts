import type { ComponentType } from 'react';
import {
  conceptBodies,
  scenarioBodies,
} from '../generated/body-text';
import {
  knowledgePointFrontmatterSchema,
  lawFileSchema,
  scenarioFrontmatterSchema,
  themeSchema,
  type KnowledgePointFrontmatter,
  type Law,
  type LawArticle,
  type LawFile,
  type ScenarioFrontmatter,
  type Theme,
} from './schema';

export type ScenarioEntry = {
  meta: ScenarioFrontmatter & { themeId: string };
  Content: ComponentType;
  bodyText: string;
};

export type KnowledgePointEntry = {
  meta: KnowledgePointFrontmatter & { themeId: string };
  Content: ComponentType;
  bodyText: string;
};

type MdxModule = {
  default: ComponentType;
  frontmatter: unknown;
};

type ThemeModule = { default: unknown };
type LawModule = { default: unknown };

type Parser<T> = { parse: (value: unknown) => T };

const themeModules = import.meta.glob<ThemeModule>(
  '/content/themes/*/theme.json',
  { eager: true },
);
const scenarioModules = import.meta.glob<MdxModule>(
  '/content/themes/*/scenarios/*.mdx',
  { eager: true },
);
const conceptModules = import.meta.glob<MdxModule>(
  '/content/themes/*/concepts/*.mdx',
  { eager: true },
);
const lawModules = import.meta.glob<LawModule>('/content/laws/*.json', {
  eager: true,
});

function themeIdOf(key: string): string {
  return key.split('/').filter(Boolean)[2] ?? '';
}

function parseOrThrow<T>(
  key: string,
  parser: Parser<T>,
  value: unknown,
): T {
  try {
    return parser.parse(value);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`内容错误：${key} ${detail}`, { cause: error });
  }
}

const themes: Theme[] = Object.entries(themeModules)
  .map(([key, module]) =>
    parseOrThrow(key, themeSchema, module.default),
  )
  .sort((a, b) => a.order - b.order);

const scenarios: ScenarioEntry[] = Object.entries(scenarioModules)
  .map(([key, module]) => {
    const meta = {
      ...parseOrThrow(
        key,
        scenarioFrontmatterSchema,
        module.frontmatter,
      ),
      themeId: themeIdOf(key),
    };
    return {
      meta,
      Content: module.default,
      bodyText: scenarioBodies[meta.id] ?? '',
    };
  })
  .sort((a, b) => a.meta.order - b.meta.order);

const knowledgePoints: KnowledgePointEntry[] = Object.entries(
  conceptModules,
)
  .map(([key, module]) => {
    const meta = {
      ...parseOrThrow(
        key,
        knowledgePointFrontmatterSchema,
        module.frontmatter,
      ),
      themeId: themeIdOf(key),
    };
    return {
      meta,
      Content: module.default,
      bodyText: conceptBodies[meta.id] ?? '',
    };
  })
  .sort((a, b) => a.meta.order - b.meta.order);

const lawFiles: LawFile[] = Object.entries(lawModules)
  .map(([key, module]) =>
    parseOrThrow(key, lawFileSchema, module.default),
  )
  .sort((a, b) => a.law.title.localeCompare(b.law.title, 'zh-CN'));

const laws = lawFiles.map((file) => file.law);
const lawById = new Map(lawFiles.map((file) => [file.law.id, file]));
const articlesByLaw = new Map(
  lawFiles.map((file) => [
    file.law.id,
    new Map(file.articles.map((article) => [article.articleNo, article])),
  ]),
);

const scenarioById = new Map(
  scenarios.map((entry) => [entry.meta.id, entry]),
);
const knowledgePointById = new Map(
  knowledgePoints.map((entry) => [entry.meta.id, entry]),
);

export function getThemes(): Theme[] {
  return themes;
}

export function getTheme(themeId: string): Theme | undefined {
  return themes.find((theme) => theme.id === themeId);
}

export function getScenarios(themeId: string): ScenarioEntry[] {
  return scenarios.filter((entry) => entry.meta.themeId === themeId);
}

export function getScenario(
  scenarioId: string,
): ScenarioEntry | undefined {
  return scenarioById.get(scenarioId);
}

export function getKnowledgePoint(
  kpId: string,
): KnowledgePointEntry | undefined {
  return knowledgePointById.get(kpId);
}

export function getKnowledgePoints(
  themeId?: string,
): KnowledgePointEntry[] {
  return themeId
    ? knowledgePoints.filter((entry) => entry.meta.themeId === themeId)
    : knowledgePoints;
}

export function getLaws(): Law[] {
  return laws;
}

export function getLaw(lawId: string): Law | undefined {
  return lawById.get(lawId)?.law;
}

export function getArticle(
  lawId: string,
  articleNo: string,
): LawArticle | undefined {
  return articlesByLaw.get(lawId)?.get(articleNo);
}

export function getArticles(lawId: string): LawArticle[] {
  return lawById.get(lawId)?.articles ?? [];
}
