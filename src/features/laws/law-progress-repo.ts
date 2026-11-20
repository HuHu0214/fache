import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LawProgress } from '../../lib/db';
import {
  advanceLawProgress,
  createFirstLawProgress,
} from '../../lib/ebbinghaus';
import { scheduleSqliteSave } from '../../lib/sqlite-sync';

export function progressKey(lawId: string, articleNo: string): string {
  return `${lawId}:${articleNo}`;
}

export async function markLawArticle(
  lawId: string,
  articleNo: string,
  now: Date = new Date(),
): Promise<LawProgress> {
  return db.transaction('rw', db.lawProgress, async () => {
    const id = progressKey(lawId, articleNo);
    const existing = await db.lawProgress.get(id);
    const next = advanceLawProgress(
      existing,
      lawId,
      articleNo,
      now,
    );
    await db.lawProgress.put(next);
    scheduleSqliteSave();
    return next;
  });
}

export async function markLawArticlesLearned(
  lawId: string,
  articleNos: string[],
  now: Date = new Date(),
): Promise<number> {
  const unique = [...new Set(articleNos)];
  if (unique.length === 0) {
    return 0;
  }

  return db.transaction('rw', db.lawProgress, async () => {
    const ids = unique.map((articleNo) =>
      progressKey(lawId, articleNo),
    );
    const existing = await db.lawProgress.bulkGet(ids);
    const additions: LawProgress[] = [];

    unique.forEach((articleNo, index) => {
      if (!existing[index]) {
        additions.push(
          createFirstLawProgress(lawId, articleNo, now),
        );
      }
    });

    if (additions.length > 0) {
      await db.lawProgress.bulkPut(additions);
      scheduleSqliteSave();
    }
    return additions.length;
  });
}

export async function getLawProgress(
  lawId?: string,
): Promise<LawProgress[]> {
  return lawId
    ? db.lawProgress.where('lawId').equals(lawId).toArray()
    : db.lawProgress.toArray();
}

export function useLawProgress(lawId?: string): LawProgress[] {
  return (
    useLiveQuery(
      () => getLawProgress(lawId),
      [lawId],
    ) ?? []
  );
}
