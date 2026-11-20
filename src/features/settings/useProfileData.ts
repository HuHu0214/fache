import { useLiveQuery } from 'dexie-react-hooks';
import { getLaws } from '../../content/registry';
import {
  buildStudyDays,
  computeStreakFromDays,
} from '../../lib/ebbinghaus';
import { db } from '../../lib/db';

export function useProfileData() {
  const lawProgress =
    useLiveQuery(() => db.lawProgress.toArray(), []) ?? [];
  const setting = useLiveQuery(() => db.settings.get('app'), []);
  const bonusXp = setting?.bonusXp ?? 0;

  const laws = getLaws();
  const learnedByLaw = new Map<string, number>();
  for (const record of lawProgress) {
    learnedByLaw.set(
      record.lawId,
      (learnedByLaw.get(record.lawId) ?? 0) + 1,
    );
  }

  const studyDays = buildStudyDays(lawProgress);
  const stats = {
    articlesLearned: lawProgress.length,
    lawsStarted: learnedByLaw.size,
    lawsCompleted: laws.filter(
      (law) =>
        (learnedByLaw.get(law.id) ?? 0) >= law.articleCount,
    ).length,
    stageTotal: lawProgress.reduce(
      (sum, record) => sum + record.stage,
      0,
    ),
    deepArticles: lawProgress.filter(
      (record) => record.stage >= 5,
    ).length,
    streak: computeStreakFromDays(
      studyDays,
      new Date(),
      setting?.frozenDates ?? [],
    ),
    bonusXp,
  };

  return { lawProgress, setting, stats, studyDays, laws };
}
