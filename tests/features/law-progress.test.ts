import { db } from '../../src/lib/db';
import {
  markLawArticle,
  markLawArticlesLearned,
} from '../../src/features/laws/law-progress-repo';

beforeEach(async () => {
  await db.lawProgress.clear();
});

test('逐条标记法条并按阶段加深', async () => {
  const first = await markLawArticle(
    'civil-code',
    '第一条',
    new Date('2026-11-20T09:00:00'),
  );
  expect(first.stage).toBe(1);

  const second = await markLawArticle(
    'civil-code',
    '第一条',
    new Date('2026-11-21T09:00:00'),
  );
  expect(second.stage).toBe(2);
  expect(second.learnCount).toBe(2);
  expect(second.studyDays).toEqual(['2026-11-20', '2026-11-21']);
});

test('批量标记只补未学，不推进已学阶段', async () => {
  await markLawArticle(
    'civil-code',
    '第一条',
    new Date('2026-11-20T09:00:00'),
  );

  const added = await markLawArticlesLearned(
    'civil-code',
    ['第一条', '第二条', '第三条'],
    new Date('2026-11-20T10:00:00'),
  );
  expect(added).toBe(2);
  expect((await db.lawProgress.get('civil-code:第一条'))?.stage).toBe(1);
  expect(await db.lawProgress.count()).toBe(3);
});
