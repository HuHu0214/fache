import { db, type Progress } from '../../lib/db';

export async function getProgress(
  kpId: string,
): Promise<Progress | undefined> {
  return db.progress.get(kpId);
}

export async function putProgress(progress: Progress): Promise<void> {
  const due = progress.card
    ? new Date(progress.card.due).toISOString()
    : progress.due;
  await db.progress.put({
    ...progress,
    due,
    updatedAt: progress.updatedAt || new Date().toISOString(),
  });
}

export async function listProgress(): Promise<Progress[]> {
  return db.progress.toArray();
}
