import { db } from '../../lib/db';

export async function clearBoss(
  themeId: string,
  reward = 100,
): Promise<boolean> {
  const existing = await db.settings.get('app');
  const cleared = existing?.bossCleared ?? [];

  if (cleared.includes(themeId)) {
    return false;
  }

  await db.settings.put({
    ...(existing ?? { id: 'app' as const, theme: 'dark' as const }),
    id: 'app',
    bossCleared: [...cleared, themeId],
    bonusXp: (existing?.bonusXp ?? 0) + reward,
  });

  return true;
}
