import type { LawProgress } from './db';
import { localDateKey, shiftDays } from './date';

export const EBBINGHAUS_STAGES = [
  { stage: 1, label: '初识', intervalDays: 1 },
  { stage: 2, label: '温故', intervalDays: 2 },
  { stage: 3, label: '熟悉', intervalDays: 4 },
  { stage: 4, label: '牢记', intervalDays: 7 },
  { stage: 5, label: '稳固', intervalDays: 15 },
  { stage: 6, label: '长驻', intervalDays: 30 },
  { stage: 7, label: '成诵', intervalDays: 60 },
] as const;

export const MAX_STAGE = EBBINGHAUS_STAGES.length;

export function stageInfo(stage: number) {
  return (
    EBBINGHAUS_STAGES[
      Math.min(MAX_STAGE, Math.max(1, stage)) - 1
    ] ?? EBBINGHAUS_STAGES[0]
  );
}

export function advanceLawProgress(
  existing: LawProgress | undefined,
  lawId: string,
  articleNo: string,
  now: Date = new Date(),
): LawProgress {
  const stage = existing
    ? Math.min(MAX_STAGE, existing.stage + 1)
    : 1;
  const interval = stageInfo(stage).intervalDays;
  const nowIso = now.toISOString();
  const today = localDateKey(now);
  const studyDays = new Set(existing?.studyDays ?? []);
  studyDays.add(today);

  return {
    id: `${lawId}:${articleNo}`,
    lawId,
    articleNo,
    stage,
    learnCount: (existing?.learnCount ?? 0) + 1,
    firstLearnedAt: existing?.firstLearnedAt ?? nowIso,
    lastStudiedAt: nowIso,
    nextDueAt: shiftDays(now, interval).toISOString(),
    studyDays: [...studyDays].sort(),
  };
}

export function createFirstLawProgress(
  lawId: string,
  articleNo: string,
  now: Date = new Date(),
): LawProgress {
  return advanceLawProgress(undefined, lawId, articleNo, now);
}

export function isDue(
  progress: Pick<LawProgress, 'nextDueAt'>,
  now: Date = new Date(),
): boolean {
  return new Date(progress.nextDueAt).getTime() <= now.getTime();
}

export function daysUntilDue(
  progress: Pick<LawProgress, 'nextDueAt'>,
  now: Date = new Date(),
): number {
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const due = new Date(progress.nextDueAt);
  const dueDay = new Date(
    due.getFullYear(),
    due.getMonth(),
    due.getDate(),
  ).getTime();
  return Math.round((dueDay - start) / 86_400_000);
}

export function formatDue(
  progress: Pick<LawProgress, 'nextDueAt'>,
  now: Date = new Date(),
): string {
  const days = daysUntilDue(progress, now);
  if (days <= 0) {
    return '今日加深';
  }
  if (days === 1) {
    return '明日';
  }
  const due = new Date(progress.nextDueAt);
  return `${due.getMonth() + 1}月${due.getDate()}日`;
}

export function buildStageCounts(
  records: LawProgress[],
): number[] {
  const counts = Array.from({ length: MAX_STAGE }, () => 0);
  for (const record of records) {
    const index = Math.min(MAX_STAGE, Math.max(1, record.stage)) - 1;
    counts[index] += 1;
  }
  return counts;
}

export type DueBucket = {
  dateKey: string;
  label: string;
  count: number;
};

export function buildDueCurve(
  records: LawProgress[],
  now: Date = new Date(),
  days = 7,
): DueBucket[] {
  const buckets: DueBucket[] = [];
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  for (let index = 0; index < days; index += 1) {
    const date = shiftDays(today, index);
    buckets.push({
      dateKey: localDateKey(date),
      label:
        index === 0
          ? '今天'
          : index === 1
            ? '明天'
            : `${date.getMonth() + 1}/${date.getDate()}`,
      count: 0,
    });
  }

  const byKey = new Map(buckets.map((bucket) => [bucket.dateKey, bucket]));

  for (const record of records) {
    const due = new Date(record.nextDueAt);
    const dueKey = localDateKey(due);
    const bucket = byKey.get(dueKey);
    if (bucket) {
      bucket.count += 1;
      continue;
    }
    if (due.getTime() < today.getTime()) {
      buckets[0].count += 1;
    }
  }

  return buckets;
}

export type LawProgressSummary = {
  lawId: string;
  learned: number;
  due: number;
  stageTotal: number;
  lastStudiedAt: string;
};

export function summarizeByLaw(
  records: LawProgress[],
  now: Date = new Date(),
): Map<string, LawProgressSummary> {
  const summaries = new Map<string, LawProgressSummary>();

  for (const record of records) {
    const current = summaries.get(record.lawId) ?? {
      lawId: record.lawId,
      learned: 0,
      due: 0,
      stageTotal: 0,
      lastStudiedAt: record.lastStudiedAt,
    };
    current.learned += 1;
    current.stageTotal += record.stage;
    if (record.lastStudiedAt > current.lastStudiedAt) {
      current.lastStudiedAt = record.lastStudiedAt;
    }
    summaries.set(record.lawId, current);
  }

  for (const record of records) {
    if (isDue(record, now)) {
      const summary = summaries.get(record.lawId);
      if (summary) {
        summary.due += 1;
      }
    }
  }

  return summaries;
}

export function buildStudyDays(records: LawProgress[]): string[] {
  const days = new Set<string>();
  for (const record of records) {
    for (const day of record.studyDays) {
      days.add(day);
    }
  }
  return [...days].sort();
}

export function computeStreakFromDays(
  days: string[],
  now: Date,
  frozenDates: string[] = [],
): number {
  const allDays = new Set([...days, ...frozenDates]);
  const cursor = new Date(now);
  let streak = 0;

  while (allDays.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
