import { db } from '../../src/lib/db';
import {
  chestBonus,
  localDateKey,
  openDailyChest,
} from '../../src/features/rewards/daily-chest';

beforeEach(async () => {
  await db.settings.clear();
});

test('日期键使用本地日期', () => {
  expect(localDateKey(new Date(2026, 10, 20, 23, 30))).toBe(
    '2026-11-20',
  );
});

test('宝箱奖励在 20 到 30 之间', () => {
  expect(chestBonus(() => 0)).toBe(20);
  expect(chestBonus(() => 0.999)).toBe(30);
});

test('每天只能开一次，奖励会累计', async () => {
  const first = await openDailyChest(
    new Date(2026, 10, 20, 9),
    () => 0.5,
  );
  expect(first).toEqual({ opened: true, bonus: 25 });

  const second = await openDailyChest(
    new Date(2026, 10, 20, 22),
    () => 0.5,
  );
  expect(second).toEqual({ opened: false, bonus: 0 });

  const nextDay = await openDailyChest(
    new Date(2026, 10, 21, 8),
    () => 0,
  );
  expect(nextDay).toEqual({ opened: true, bonus: 20 });

  const setting = await db.settings.get('app');
  expect(setting?.bonusXp).toBe(45);
  expect(setting?.lastChestAt).toBe('2026-11-21');
});
