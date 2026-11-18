import { db } from '../../src/lib/db';
import { saveNote, getNote } from '../../src/features/notes/notes-repo';
import {
  toggleBookmark,
  isBookmarked,
} from '../../src/features/bookmarks/bookmarks-repo';
import {
  markScenarioRead,
  getReads,
} from '../../src/features/learning/reads-repo';

beforeEach(async () => {
  await Promise.all([
    db.progress.clear(),
    db.notes.clear(),
    db.bookmarks.clear(),
    db.reads.clear(),
    db.settings.clear(),
  ]);
});

test('笔记写入后可读，id 稳定', async () => {
  await saveNote('kp', 'contract-formation', '我的笔记');
  expect((await getNote('kp', 'contract-formation'))?.content).toBe(
    '我的笔记',
  );
  await saveNote('kp', 'contract-formation', '更新');
  expect(await db.notes.count()).toBe(1);
});

test('收藏可切换', async () => {
  expect(
    await toggleBookmark('scenario', 'contract-formation-story'),
  ).toBe(true);
  expect(
    await isBookmarked('scenario', 'contract-formation-story'),
  ).toBe(true);
  expect(
    await toggleBookmark('scenario', 'contract-formation-story'),
  ).toBe(false);
});

test('阅读记录持久化', async () => {
  await markScenarioRead('contract-formation-story');
  expect((await getReads()).map((r) => r.scenarioId)).toContain(
    'contract-formation-story',
  );
});
