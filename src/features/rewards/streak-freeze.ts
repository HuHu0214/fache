import { localDateKey, shiftDays } from '../../lib/date';
import { db, type Setting } from '../../lib/db';
import { scheduleSqliteSave } from '../../lib/sqlite-sync';

export function freezeTokens(
  setting: Setting | undefined,
): number {
  return setting?.freezeTokens ?? 1;
}

export async function consumeStreakFreeze(
  now: Date = new Date(),
): Promise<{ ok: boolean; date?: string }> {
  const existing = await db.settings.get('app');
  const tokens = freezeTokens(existing);

  if (tokens <= 0) {
    return { ok: false };
  }

  const date = localDateKey(shiftDays(now, -1));
  const frozen = existing?.frozenDates ?? [];

  if (frozen.includes(date)) {
    return { ok: false };
  }

  await db.settings.put({
    ...(existing ?? { id: 'app' as const, theme: 'dark' as const }),
    id: 'app',
    freezeTokens: tokens - 1,
    frozenDates: [...frozen, date],
  });
  scheduleSqliteSave();

  return { ok: true, date };
}
