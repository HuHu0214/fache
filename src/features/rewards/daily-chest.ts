import { db } from '../../lib/db';
import { localDateKey } from '../../lib/date';

export { localDateKey };

export function chestBonus(
  random: () => number = Math.random,
): number {
  return 20 + Math.floor(random() * 11);
}

export async function openDailyChest(
  now: Date = new Date(),
  random: () => number = Math.random,
): Promise<{ opened: boolean; bonus: number; freeze: boolean }> {
  const today = localDateKey(now);
  const existing = await db.settings.get('app');

  if (existing?.lastChestAt === today) {
    return { opened: false, bonus: 0, freeze: false };
  }

  const bonus = chestBonus(random);
  const freeze = random() < 0.3;
  await db.settings.put({
    ...(existing ?? { id: 'app' as const, theme: 'dark' as const }),
    id: 'app',
    bonusXp: (existing?.bonusXp ?? 0) + bonus,
    freezeTokens:
      (existing?.freezeTokens ?? 1) + (freeze ? 1 : 0),
    lastChestAt: today,
  });

  return { opened: true, bonus, freeze };
}
