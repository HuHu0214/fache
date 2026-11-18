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

export function computeStreak(reads: Read[], now: Date): number {
  const days = new Set(reads.map((read) => read.readAt.slice(0, 10)));
  const cursor = new Date(now);
  let streak = 0;

  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}
