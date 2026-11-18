import { db } from '../../src/lib/db';
import { saveNote, getNote } from '../../src/features/notes/notes-repo';
import { rateKnowledgePoint } from '../../src/features/learning/rating';
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

test('非法备份被拒绝且不清空现有数据', async () => {
  await saveNote('kp', 'contract-formation', '保留');
  await expect(importBackup({ version: 99 })).rejects.toThrow();
  expect((await getNote('kp', 'contract-formation'))?.content).toBe(
    '保留',
  );
});
