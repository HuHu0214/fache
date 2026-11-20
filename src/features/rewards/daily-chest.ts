import { db } from '../../lib/db';

export function localDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function chestBonus(
  random: () => number = Math.random,
): number {
  return 20 + Math.floor(random() * 11);
}

export async function openDailyChest(
  now: Date = new Date(),
  random: () => number = Math.random,
): Promise<{ opened: boolean; bonus: number }> {
  const today = localDateKey(now);
  const existing = await db.settings.get('app');

  if (existing?.lastChestAt === today) {
    return { opened: false, bonus: 0 };
  }

  const bonus = chestBonus(random);
  await db.settings.put({
    ...(existing ?? { id: 'app' as const, theme: 'dark' as const }),
    id: 'app',
    bonusXp: (existing?.bonusXp ?? 0) + bonus,
    lastChestAt: today,
  });

  return { opened: true, bonus };
}
