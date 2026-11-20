import { z } from 'zod';
import { articleRefSchema, idSchema } from './schema';

export const bossQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  answer: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
  articleRefs: z.array(articleRefSchema).default([]),
});

export const bossSchema = z.object({
  themeId: idSchema,
  title: z.string().min(1),
  passScore: z.number().int().positive(),
  questions: z.array(bossQuestionSchema).min(1),
  reviewStatus: z.enum(['draft', 'checked']).default('draft'),
});

export type BossQuestion = z.infer<typeof bossQuestionSchema>;
export type Boss = z.infer<typeof bossSchema>;
