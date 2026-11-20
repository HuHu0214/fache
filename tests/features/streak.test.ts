import { db } from '../../src/lib/db';
import { computeStreak } from '../../src/features/learning/theme-progress';
import { consumeStreakFreeze } from '../../src/features/rewards/streak-freeze';
import { streakXpPerDay } from '../../src/features/settings/profile';

const read = (scenarioId: string, date: Date) => ({
  scenarioId,
  readAt: date.toISOString(),
  rated: true,
});

beforeEach(async () => {
  await db.settings.clear();
});

test('连续打卡的每日阅历随天数递增', () => {
  expect(streakXpPerDay(1)).toBe(5);
  expect(streakXpPerDay(3)).toBe(8);
  expect(streakXpPerDay(7)).toBe(12);
  expect(streakXpPerDay(14)).toBe(18);
  expect(streakXpPerDay(30)).toBe(30);
});

test('冻结日期可以续上连续天数', () => {
  const reads = [
    read('a', new Date(2026, 10, 18, 12)),
    read('b', new Date(2026, 10, 16, 12)),
  ];
  expect(
    computeStreak(reads, new Date(2026, 10, 18, 12), ['2026-11-17']),
  ).toBe(3);
});

test('使用护符会消耗一枚并记录昨天', async () => {
  const result = await consumeStreakFreeze(new Date(2026, 10, 19, 12));
  expect(result).toEqual({ ok: true, date: '2026-11-18' });

  const setting = await db.settings.get('app');
  expect(setting?.freezeTokens).toBe(0);
  expect(setting?.frozenDates).toEqual(['2026-11-18']);

  const second = await consumeStreakFreeze(new Date(2026, 10, 19, 12));
  expect(second).toEqual({ ok: false });
});
