import { db } from '../../src/lib/db';
import { saveNote, getNote } from '../../src/features/notes/notes-repo';
import { rateKnowledgePoint } from '../../src/features/learning/rating';
import { createFirstLawProgress } from '../../src/lib/ebbinghaus';
import {
  exportBackup,
  importBackup,
  exportNotesMarkdown,
} from '../../src/features/settings/backup';

beforeEach(async () => {
  await Promise.all([
    db.progress.clear(),
    db.notes.clear(),
    db.bookmarks.clear(),
    db.reads.clear(),
    db.settings.clear(),
    db.lawProgress.clear(),
  ]);
});

test('导出包含全部表并可原样导入', async () => {
  await saveNote('kp', 'contract-formation', '笔记');
  const backup = await exportBackup();
  expect(backup.version).toBe(1);
  expect(backup.notes).toHaveLength(1);

  await db.notes.clear();
  await importBackup(backup);
  expect((await getNote('kp', 'contract-formation'))?.content).toBe(
    '笔记',
  );
});

test('导出时 Date 序列化为字符串，导入后恢复为 Date', async () => {
  await rateKnowledgePoint(
    'contract-formation',
    'good',
    new Date('2026-11-18T00:00:00.000Z'),
  );
  const backup = await exportBackup();
  expect(typeof backup.progress[0].card!.due).toBe('string');

  await db.progress.clear();
  await importBackup(backup);
  const restored = await db.progress.get('contract-formation');
  expect(restored!.card!.due).toBeInstanceOf(Date);
});

test('笔记可导出 Markdown', async () => {
  await saveNote('kp', 'contract-formation', '第一条笔记');
  expect(await exportNotesMarkdown()).toContain('第一条笔记');
});

test('奖励与护符字段能随备份恢复', async () => {
  await db.settings.put({
    id: 'app',
    theme: 'dark',
    bonusXp: 120,
    freezeTokens: 2,
    frozenDates: ['2026-11-18'],
    bossCleared: ['contracts'],
    lastChestAt: '2026-11-20',
    soundEnabled: false,
  });

  const backup = await exportBackup();
  await db.settings.clear();
  await importBackup(backup);

  const restored = await db.settings.get('app');
  expect(restored).toMatchObject({
    bonusXp: 120,
    freezeTokens: 2,
    frozenDates: ['2026-11-18'],
    bossCleared: ['contracts'],
    lastChestAt: '2026-11-20',
    soundEnabled: false,
  });
});

test('法条学习阶段能随备份恢复', async () => {
  const record = createFirstLawProgress(
    'civil-code',
    '第一条',
    new Date('2026-11-20T09:00:00'),
  );
  await db.lawProgress.put(record);

  const backup = await exportBackup();
  expect(backup.lawProgress).toHaveLength(1);

  await db.lawProgress.clear();
  await importBackup(backup);
  expect(await db.lawProgress.get(record.id)).toMatchObject({
    stage: 1,
    learnCount: 1,
    studyDays: ['2026-11-20'],
  });
});

test('非法备份被拒绝且不清空现有数据', async () => {
  await saveNote('kp', 'contract-formation', '保留');
  await expect(importBackup({ version: 99 })).rejects.toThrow();
  expect((await getNote('kp', 'contract-formation'))?.content).toBe(
    '保留',
  );
});
