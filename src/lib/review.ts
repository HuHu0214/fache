import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
} from 'ts-fsrs';
import type { Progress, RatingInput } from './db';

const scheduler = fsrs(generatorParameters({ enable_fuzz: false }));

const ratingMap = {
  again: Rating.Again,
  good: Rating.Good,
  easy: Rating.Easy,
} as const;

export function scheduleProgress(
  existing: Progress | undefined,
  kpId: string,
  rating: RatingInput,
  now: Date,
): Progress {
  const card = existing?.card ?? createEmptyCard(now);
  const result = scheduler.next(card, now, ratingMap[rating]);

  return {
    kpId,
    state: result.card.state === State.Review ? 'review' : 'learning',
    card: result.card,
    due: new Date(result.card.due).toISOString(),
    lastRating: rating,
    updatedAt: now.toISOString(),
  };
}

export function dueProgress(
  progress: Progress[],
  now: Date,
): Progress[] {
  return progress
    .filter(
      (item) => item.card !== undefined && new Date(item.card.due) <= now,
    )
    .sort(
      (a, b) =>
        new Date(a.card!.due).getTime() -
        new Date(b.card!.due).getTime(),
    );
}
