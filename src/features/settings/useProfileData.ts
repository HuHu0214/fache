import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { computeStreak } from '../learning/theme-progress';

export function useProfileData() {
  const reads = useLiveQuery(() => db.reads.toArray(), []) ?? [];
  const progress =
    useLiveQuery(() => db.progress.toArray(), []) ?? [];
  const notes = useLiveQuery(() => db.notes.toArray(), []) ?? [];
  const bookmarks =
    useLiveQuery(() => db.bookmarks.toArray(), []) ?? [];
  const setting = useLiveQuery(() => db.settings.get('app'), []);
  const bonusXp = setting?.bonusXp ?? 0;

  const stats = {
    scenariosRead: reads.filter((read) => read.rated).length,
    kpsMastered: progress.filter((item) => item.state === 'review')
      .length,
    notes: notes.length,
    bookmarks: bookmarks.length,
    streak: computeStreak(reads, new Date()),
    bonusXp,
  };

  return { reads, progress, notes, bookmarks, setting, bonusXp, stats };
}
