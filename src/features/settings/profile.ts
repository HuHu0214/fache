export type ProfileStats = {
  scenariosRead: number;
  kpsMastered: number;
  notes: number;
  bookmarks: number;
  streak: number;
  bonusXp?: number;
};

export type Profile = {
  xp: number;
  level: number;
  title: string;
  nextTitle?: string;
  xpToNext: number;
  percent: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  mark: string;
  unlocked: boolean;
};

const LEVELS = [
  { level: 1, threshold: 0, title: '初窥法门' },
  { level: 2, threshold: 60, title: '入门学徒' },
  { level: 3, threshold: 150, title: '卷宗读者' },
  { level: 4, threshold: 300, title: '条文熟手' },
  { level: 5, threshold: 500, title: '法理行者' },
  { level: 6, threshold: 800, title: '明律之士' },
  { level: 7, threshold: 1200, title: '大律' },
] as const;

export function streakXpPerDay(streak: number): number {
  if (streak >= 30) {
    return 30;
  }
  if (streak >= 14) {
    return 18;
  }
  if (streak >= 7) {
    return 12;
  }
  if (streak >= 3) {
    return 8;
  }
  return 5;
}

export function computeProfile(stats: ProfileStats): Profile {
  const xp =
    stats.scenariosRead * 10 +
    stats.kpsMastered * 25 +
    stats.notes * 5 +
    stats.bookmarks * 3 +
    stats.streak * streakXpPerDay(stats.streak) +
    (stats.bonusXp ?? 0);

  let index = 0;
  for (let i = 0; i < LEVELS.length; i += 1) {
    if (xp >= LEVELS[i].threshold) {
      index = i;
    }
  }

  const current = LEVELS[index];
  const next = LEVELS[index + 1];
  const percent = next
    ? Math.min(
        100,
        ((xp - current.threshold) /
          (next.threshold - current.threshold)) *
          100,
      )
    : 100;

  return {
    xp,
    level: current.level,
    title: current.title,
    nextTitle: next?.title,
    xpToNext: next ? next.threshold - xp : 0,
    percent,
  };
}

export function computeAchievements(
  stats: ProfileStats,
  options: { exported?: boolean } = {},
): Achievement[] {
  return [
    {
      id: 'first-read',
      title: '开卷一读',
      description: '读完第一个场景',
      mark: '卷',
      unlocked: stats.scenariosRead >= 1,
    },
    {
      id: 'three-reads',
      title: '渐入佳境',
      description: '读完三个场景',
      mark: '读',
      unlocked: stats.scenariosRead >= 3,
    },
    {
      id: 'ten-mastered',
      title: '十法入心',
      description: '掌握十个知识点',
      mark: '心',
      unlocked: stats.kpsMastered >= 10,
    },
    {
      id: 'first-note',
      title: '笔下有记',
      description: '写下第一条笔记',
      mark: '记',
      unlocked: stats.notes >= 1,
    },
    {
      id: 'first-bookmark',
      title: '藏卷于匣',
      description: '收藏一个场景或知识点',
      mark: '藏',
      unlocked: stats.bookmarks >= 1,
    },
    {
      id: 'streak-3',
      title: '三日不辍',
      description: '连续学习三天',
      mark: '恒',
      unlocked: stats.streak >= 3,
    },
    {
      id: 'streak-7',
      title: '七日成习',
      description: '连续学习七天',
      mark: '习',
      unlocked: stats.streak >= 7,
    },
    {
      id: 'archive',
      title: '封存档案',
      description: '导出过一次学习数据',
      mark: '档',
      unlocked: options.exported === true,
    },
  ];
}
