import { buildReviewQueue } from '../../src/features/review/queue';
import { scheduleProgress } from '../../src/lib/review';

const past = new Date('2026-11-01T00:00:00.000Z');

test('过滤掉内容里不存在的知识点，避免复习页卡死', () => {
  const known = scheduleProgress(
    undefined,
    'contract-formation',
    'again',
    past,
  );
  const orphan = scheduleProgress(
    undefined,
    'removed-content-id',
    'again',
    past,
  );
  const queue = buildReviewQueue(
    [orphan, known],
    new Date('2026-11-20T00:00:00.000Z'),
  );
  expect(queue.map((item) => item.kpId)).toEqual([
    'contract-formation',
  ]);
});
