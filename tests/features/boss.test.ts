import type { BossQuestion } from '../../src/content/boss-schema';
import { gradeBoss } from '../../src/features/boss/grade';
import { clearBoss } from '../../src/features/boss/boss-repo';
import { db } from '../../src/lib/db';

const question = (answer: number): BossQuestion => ({
  id: `q-${answer}`,
  question: '测试题',
  options: ['A', 'B', 'C', 'D'],
  answer,
  explanation: '解析',
  articleRefs: [],
});

beforeEach(async () => {
  await db.settings.clear();
});

test('按答案计分并判断通过', () => {
  const questions = [question(0), question(1), question(2)];
  expect(gradeBoss(questions, [0, 1, 3], 2)).toEqual({
    score: 2,
    total: 3,
    passed: true,
  });
  expect(gradeBoss(questions, [1, 1, 3], 2)).toEqual({
    score: 1,
    total: 3,
    passed: false,
  });
});

test('Boss 只发一次奖励，并记录通关', async () => {
  expect(await clearBoss('contracts')).toBe(true);
  expect(await clearBoss('contracts')).toBe(false);

  const setting = await db.settings.get('app');
  expect(setting?.bossCleared).toEqual(['contracts']);
  expect(setting?.bonusXp).toBe(100);
});
