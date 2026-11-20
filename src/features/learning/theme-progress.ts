import { localDateKey } from '../../lib/date';
import type { Progress, Read } from '../../lib/db';

export type ThemeProgress = {
  scenariosRead: number;
  scenariosTotal: number;
  kpsMastered: number;
  kpsTotal: number;
};

export type ThemeProgressInput = {
  scenarioIds: string[];
  kpIds: string[];
  readScenarioIds: string[];
  progress: Array<Pick<Progress, 'kpId' | 'state'>>;
};

export function computeThemeProgress(
  input: ThemeProgressInput,
): ThemeProgress {
  const read = new Set(input.readScenarioIds);
  const kpIds = new Set(input.kpIds);

  return {
    scenariosRead: input.scenarioIds.filter((id) => read.has(id)).length,
    scenariosTotal: input.scenarioIds.length,
    kpsMastered: input.progress.filter(
      (item) => item.state === 'review' && kpIds.has(item.kpId),
    ).length,
    kpsTotal: input.kpIds.length,
  };
}

export function computeStreak(
  reads: Read[],
  now: Date,
  frozenDates: string[] = [],
): number {
  const days = new Set([
    ...frozenDates,
    ...reads.map((read) => localDateKey(new Date(read.readAt))),
  ]);
  const cursor = new Date(now);
  let streak = 0;

  while (days.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
