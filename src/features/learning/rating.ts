import type { RatingInput } from '../../lib/db';
import { scheduleProgress } from '../../lib/review';
import { getProgress, putProgress } from './progress-repo';

export async function rateKnowledgePoint(
  kpId: string,
  rating: RatingInput,
  now: Date = new Date(),
): Promise<void> {
  const existing = await getProgress(kpId);
  await putProgress(scheduleProgress(existing, kpId, rating, now));
}

export async function touchKnowledgePoint(
  kpId: string,
): Promise<void> {
  const existing = await getProgress(kpId);
  if (existing) {
    return;
  }
  await putProgress({
    kpId,
    state: 'touched',
    updatedAt: new Date().toISOString(),
  });
}
