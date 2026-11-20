import { getKnowledgePoint } from '../../content/registry';
import type { Progress } from '../../lib/db';
import { dueProgress } from '../../lib/review';

export function buildReviewQueue(
  progress: Progress[],
  now: Date,
): Progress[] {
  return dueProgress(progress, now).filter(
    (item) => getKnowledgePoint(item.kpId) !== undefined,
  );
}
