export type ProfileStats = {
  articlesLearned: number;
  lawsStarted: number;
  lawsCompleted: number;
  stageTotal: number;
  deepArticles: number;
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
  const depthXp =
    Math.max(0, stats.stageTotal - stats.articlesLearned) * 5;
  const xp =
    stats.articlesLearned * 10 +
    stats.lawsStarted * 5 +
    stats.lawsCompleted * 50 +
    depthXp +
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
      id: 'first-article',
      title: '开卷有得',
      description: '标记第一条法条',
      mark: '条',
      unlocked: stats.articlesLearned >= 1,
    },
    {
      id: 'ten-articles',
      title: '十条规定',
      description: '学过十条法条',
      mark: '十',
      unlocked: stats.articlesLearned >= 10,
    },
    {
      id: 'hundred-articles',
      title: '百条入眼',
      description: '学过一百条法条',
      mark: '百',
      unlocked: stats.articlesLearned >= 100,
    },
    {
      id: 'thousand-articles',
      title: '千条成册',
      description: '学过一千条法条',
      mark: '千',
      unlocked: stats.articlesLearned >= 1000,
    },
    {
      id: 'first-law',
      title: '一法通',
      description: '学完一部法律的全部条文',
      mark: '通',
      unlocked: stats.lawsCompleted >= 1,
    },
    {
      id: 'three-laws',
      title: '三法通',
      description: '学完三部法律',
      mark: '三',
      unlocked: stats.lawsCompleted >= 3,
    },
    {
      id: 'deep-article',
      title: '温故知新',
      description: '把一条法条推进到第五阶',
      mark: '深',
      unlocked: stats.deepArticles >= 1,
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
