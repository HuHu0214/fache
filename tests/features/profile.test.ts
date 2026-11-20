import {
  computeAchievements,
  computeProfile,
} from '../../src/features/settings/profile';

const empty = {
  articlesLearned: 0,
  lawsStarted: 0,
  lawsCompleted: 0,
  stageTotal: 0,
  deepArticles: 0,
  streak: 0,
};

test('空档案是 1 级、0 经验', () => {
  expect(computeProfile(empty)).toMatchObject({
    xp: 0,
    level: 1,
    title: '初窥法门',
  });
});

test('按法条学习量计算经验与等级', () => {
  const profile = computeProfile({
    articlesLearned: 6,
    lawsStarted: 2,
    lawsCompleted: 1,
    stageTotal: 9,
    deepArticles: 1,
    streak: 3,
  });
  expect(profile.xp).toBe(159);
  expect(profile.level).toBe(3);
  expect(profile.title).toBe('卷宗读者');
});

test('成就按法条进度解锁', () => {
  const achievements = computeAchievements(
    {
      articlesLearned: 10,
      lawsStarted: 2,
      lawsCompleted: 1,
      stageTotal: 15,
      deepArticles: 1,
      streak: 3,
    },
    { exported: false },
  );
  expect(
    achievements.find((item) => item.id === 'ten-articles')?.unlocked,
  ).toBe(true);
  expect(
    achievements.find((item) => item.id === 'first-law')?.unlocked,
  ).toBe(true);
  expect(
    achievements.find((item) => item.id === 'three-laws')?.unlocked,
  ).toBe(false);
  expect(
    achievements.find((item) => item.id === 'streak-7')?.unlocked,
  ).toBe(false);
});
