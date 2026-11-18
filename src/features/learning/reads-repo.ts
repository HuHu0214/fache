import { db, type Read } from '../../lib/db';

export async function markScenarioRead(
  scenarioId: string,
): Promise<void> {
  const existing = await db.reads.get(scenarioId);
  await db.reads.put({
    scenarioId,
    readAt: new Date().toISOString(),
    rated: existing?.rated ?? false,
  });
}

export async function markScenarioRated(
  scenarioId: string,
): Promise<void> {
  const existing = await db.reads.get(scenarioId);
  if (!existing) {
    return;
  }
  await db.reads.put({ ...existing, rated: true });
}

export async function getReads(): Promise<Read[]> {
  return db.reads.toArray();
}
