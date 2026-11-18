import type { Card } from 'ts-fsrs';
import { z } from 'zod';
import {
  getKnowledgePoint,
  getScenario,
} from '../../content/registry';
import { db, type Progress } from '../../lib/db';
import { listNotes } from '../notes/notes-repo';

const serializedCardSchema = z
  .object({
    due: z.string(),
    last_review: z.string().optional(),
    stability: z.number(),
    difficulty: z.number(),
    scheduled_days: z.number(),
    learning_steps: z.number().optional(),
    reps: z.number(),
    lapses: z.number(),
    state: z.number(),
  })
  .passthrough();

const serializedProgressSchema = z.object({
  kpId: z.string(),
  state: z.enum(['touched', 'learning', 'review']),
  card: serializedCardSchema.optional(),
  due: z.string().optional(),
  lastRating: z.enum(['again', 'good', 'easy']).optional(),
  updatedAt: z.string(),
});

const backupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  progress: z.array(serializedProgressSchema),
  notes: z.array(
    z.object({
      id: z.string(),
      targetType: z.enum(['scenario', 'kp']),
      targetId: z.string(),
      content: z.string(),
      updatedAt: z.string(),
    }),
  ),
  bookmarks: z.array(
    z.object({
      id: z.string(),
      targetType: z.enum(['scenario', 'kp']),
      targetId: z.string(),
      createdAt: z.string(),
    }),
  ),
  reads: z.array(
    z.object({
      scenarioId: z.string(),
      readAt: z.string(),
      rated: z.boolean(),
    }),
  ),
  settings: z.array(
    z.object({
      id: z.literal('app'),
      theme: z.enum(['light', 'dark', 'system']),
      disclaimerAcceptedAt: z.string().optional(),
    }),
  ),
});

export type SerializedProgress = z.infer<
  typeof serializedProgressSchema
>;
export type Backup = z.infer<typeof backupSchema>;

function serializeProgress(progress: Progress): SerializedProgress {
  const { card, ...rest } = progress;
  if (!card) {
    return rest;
  }
  return {
    ...rest,
    card: {
      ...card,
      due: new Date(card.due).toISOString(),
      last_review: card.last_review
        ? new Date(card.last_review).toISOString()
        : undefined,
    } as SerializedProgress['card'],
  };
}

function reviveProgress(item: SerializedProgress): Progress {
  if (!item.card) {
    return {
      kpId: item.kpId,
      state: item.state,
      due: item.due,
      lastRating: item.lastRating,
      updatedAt: item.updatedAt,
    };
  }

  const card = {
    ...item.card,
    due: new Date(item.card.due),
    last_review: item.card.last_review
      ? new Date(item.card.last_review)
      : undefined,
  } as unknown as Card;

  return {
    kpId: item.kpId,
    state: item.state,
    card,
    due: item.due,
    lastRating: item.lastRating,
    updatedAt: item.updatedAt,
  };
}

export async function exportBackup(): Promise<Backup> {
  const [progress, notes, bookmarks, reads, settings] =
    await Promise.all([
      db.progress.toArray(),
      db.notes.toArray(),
      db.bookmarks.toArray(),
      db.reads.toArray(),
      db.settings.toArray(),
    ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: progress.map(serializeProgress),
    notes,
    bookmarks,
    reads,
    settings,
  };
}

export async function importBackup(data: unknown): Promise<void> {
  const parsed = backupSchema.parse(data);
  const progress = parsed.progress.map(reviveProgress);

  await db.transaction(
    'rw',
    db.progress,
    db.notes,
    db.bookmarks,
    db.reads,
    db.settings,
    async () => {
      await Promise.all([
        db.progress.clear(),
        db.notes.clear(),
        db.bookmarks.clear(),
        db.reads.clear(),
        db.settings.clear(),
      ]);
      await db.progress.bulkPut(progress);
      if (parsed.notes.length > 0) {
        await db.notes.bulkPut(parsed.notes);
      }
      if (parsed.bookmarks.length > 0) {
        await db.bookmarks.bulkPut(parsed.bookmarks);
      }
      if (parsed.reads.length > 0) {
        await db.reads.bulkPut(parsed.reads);
      }
      if (parsed.settings.length > 0) {
        await db.settings.bulkPut(parsed.settings);
      }
    },
  );
}

export async function exportNotesMarkdown(): Promise<string> {
  const notes = await listNotes();
  return notes
    .map((note) => {
      const title =
        note.targetType === 'scenario'
          ? getScenario(note.targetId)?.meta.title
          : getKnowledgePoint(note.targetId)?.meta.title;
      return `## ${title ?? note.targetId}\n\n${note.content}\n`;
    })
    .join('\n');
}
