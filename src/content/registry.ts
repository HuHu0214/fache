import type { ComponentType } from 'react';
import {
  conceptBodies,
  scenarioBodies,
} from '../generated/body-text';
import { lawIndex } from '../generated/law-index';
import { bossSchema, type Boss } from './boss-schema';
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
export const CORE_LAW_IDS = [
  'civil-code',
  'labor-contracts-law',
  'labor-law',
  'labor-dispute-mediation-and-arbitration-law',
  'social-insurance-law',
  'anti-domestic-violence-law',
  'e-commerce-law',
] as const;

const coreLawModules = import.meta.glob<LawModule>(
  [
    '/content/laws/civil-code.json',
    '/content/laws/labor-contracts-law.json',
    '/content/laws/labor-law.json',
    '/content/laws/labor-dispute-mediation-and-arbitration-law.json',
    '/content/laws/social-insurance-law.json',
    '/content/laws/anti-domestic-violence-law.json',
    '/content/laws/e-commerce-law.json',
  ],
  { eager: true },
);
const lawModules = import.meta.glob<LawModule>([
  '/content/laws/*.json',
  '!/content/laws/civil-code.json',
  '!/content/laws/labor-contracts-law.json',
  '!/content/laws/labor-law.json',
  '!/content/laws/labor-dispute-mediation-and-arbitration-law.json',
  '!/content/laws/social-insurance-law.json',
  '!/content/laws/anti-domestic-violence-law.json',
  '!/content/laws/e-commerce-law.json',
]);
const bossModules = import.meta.glob<LawModule>(
  '/content/bosses/*.json',
  { eager: true },
);

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

const bosses: Boss[] = Object.entries(bossModules)
  .map(([key, module]) =>
    parseOrThrow(key, bossSchema, module.default),
  )
  .sort((a, b) => a.themeId.localeCompare(b.themeId, 'zh-CN'));
const bossByTheme = new Map(
  bosses.map((boss) => [boss.themeId, boss]),
);

const coreLawFiles: LawFile[] = Object.entries(coreLawModules)
  .map(([key, module]) =>
    parseOrThrow(key, lawFileSchema, module.default),
  )
  .sort((a, b) => a.law.title.localeCompare(b.law.title, 'zh-CN'));
const coreArticlesByLaw = new Map(
  coreLawFiles.map((file) => [
    file.law.id,
    new Map(file.articles.map((article) => [article.articleNo, article])),
  ]),
);

const laws = lawIndex;
const lawById = new Map(laws.map((law) => [law.id, law]));
const lawFileCache = new Map<string, Promise<LawFile>>(
  coreLawFiles.map((file) => [file.law.id, Promise.resolve(file)]),
);

function lawModuleKey(lawId: string): string {
  return `/content/laws/${lawId}.json`;
}

export function loadLawFile(lawId: string): Promise<LawFile> {
  const cached = lawFileCache.get(lawId);
  if (cached) {
    return cached;
  }

  if (!lawById.has(lawId)) {
    return Promise.reject(new Error(`未知法律：${lawId}`));
  }

  const key = lawModuleKey(lawId);
  const loader = lawModules[key];
  if (!loader) {
    return Promise.reject(new Error(`缺少法律文件：${key}`));
  }

  const promise = loader().then((module) =>
    parseOrThrow(key, lawFileSchema, module.default),
  );
  lawFileCache.set(lawId, promise);
  return promise;
}

export async function loadLawFiles(): Promise<LawFile[]> {
  return Promise.all(laws.map((law) => loadLawFile(law.id)));
}

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

export function getBosses(): Boss[] {
  return bosses;
}

export function getBoss(themeId: string): Boss | undefined {
  return bossByTheme.get(themeId);
}

export function getLaws(): Law[] {
  return laws;
}

export function getLaw(lawId: string): Law | undefined {
  return lawById.get(lawId);
}

export function getArticle(
  lawId: string,
  articleNo: string,
): LawArticle | undefined {
  return coreArticlesByLaw.get(lawId)?.get(articleNo);
}

export function getArticles(lawId: string): LawArticle[] {
  return coreLawFiles.find((file) => file.law.id === lawId)?.articles ?? [];
}

export async function loadArticles(
  lawId: string,
): Promise<LawArticle[]> {
  const file = await loadLawFile(lawId);
  return file.articles;
}

export async function loadArticle(
  lawId: string,
  articleNo: string,
): Promise<LawArticle | undefined> {
  const articles = await loadArticles(lawId);
  return articles.find((article) => article.articleNo === articleNo);
}
