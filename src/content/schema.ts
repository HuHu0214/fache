import { z } from 'zod';

export const idSchema = z.string().regex(/^[a-z][a-z0-9-]*$/);
export const articleNoSchema = z
  .string()
  .regex(/^第[一二三四五六七八九十百千零〇两]+条$/);
export const reviewStatusSchema = z.enum(['draft', 'checked']).default('draft');

export const articleRefSchema = z.object({
  lawId: idSchema,
  articleNo: articleNoSchema,
});

export const themeSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  intro: z.string().min(1),
  order: z.number().int().nonnegative(),
});

export const scenarioFrontmatterSchema = z
  .object({
    id: idSchema,
    title: z.string().min(1),
    hook: z.string().min(1),
    thinkPrompt: z.string().optional(),
    kpIds: z.array(idSchema).min(1),
    primaryKpId: idSchema,
    articleRefs: z.array(articleRefSchema).default([]),
    estimatedMinutes: z.number().int().positive().default(5),
    order: z.number().int().nonnegative(),
    reviewStatus: reviewStatusSchema,
  })
  .superRefine((value, ctx) => {
    if (!value.kpIds.includes(value.primaryKpId)) {
      ctx.addIssue({
        code: 'custom',
        message: 'primaryKpId 必须包含在 kpIds 中',
        path: ['primaryKpId'],
      });
    }
  });

export const knowledgePointFrontmatterSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  oneLiner: z.string().min(1),
  articleRefs: z.array(articleRefSchema).default([]),
  relatedKpIds: z.array(idSchema).default([]),
  confusions: z.array(z.string()).default([]),
  reviewPrompt: z.string().min(1),
  reviewAnswer: z.string().min(1),
  order: z.number().int().nonnegative(),
  reviewStatus: reviewStatusSchema,
});

export const lawSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  effectiveAt: z.string().min(1),
  sourceUrl: z.string().url(),
  importedAt: z.string().min(1),
  articleCount: z.number().int().positive(),
  note: z.string().optional(),
});

export const lawArticleSchema = z.object({
  lawId: idSchema,
  articleNo: articleNoSchema,
  text: z.string().min(1),
  path: z.array(z.string()),
});

export const lawFileSchema = z.object({
  law: lawSchema,
  articles: z.array(lawArticleSchema),
});

export type ArticleRef = z.infer<typeof articleRefSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type ScenarioFrontmatter = z.infer<typeof scenarioFrontmatterSchema>;
export type KnowledgePointFrontmatter = z.infer<
  typeof knowledgePointFrontmatterSchema
>;
export type Law = z.infer<typeof lawSchema>;
export type LawArticle = z.infer<typeof lawArticleSchema>;
export type LawFile = z.infer<typeof lawFileSchema>;
