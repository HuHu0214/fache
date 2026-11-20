import {
  computeAchievements,
  computeProfile,
} from '../../src/features/settings/profile';

const empty = {
  scenariosRead: 0,
  kpsMastered: 0,
  notes: 0,
  bookmarks: 0,
  streak: 0,
};

test('空档案是 1 级、0 经验', () => {
  expect(computeProfile(empty)).toMatchObject({
    xp: 0,
    level: 1,
    title: '初窥法门',
  });
});

test('按学习量计算经验与等级', () => {
  const profile = computeProfile({
    scenariosRead: 6,
    kpsMastered: 10,
    notes: 2,
    bookmarks: 1,
    streak: 3,
  });
  expect(profile.xp).toBe(347);
  expect(profile.level).toBe(4);
  expect(profile.title).toBe('条文熟手');
});

test('成就按条件解锁', () => {
  const achievements = computeAchievements(
    {
      scenariosRead: 3,
      kpsMastered: 10,
      notes: 1,
      bookmarks: 0,
      streak: 3,
    },
    { exported: false },
  );
  expect(
    achievements.find((item) => item.id === 'ten-mastered')?.unlocked,
  ).toBe(true);
  expect(
    achievements.find((item) => item.id === 'streak-7')?.unlocked,
  ).toBe(false);
  expect(
    achievements.find((item) => item.id === 'first-bookmark')
      ?.unlocked,
  ).toBe(false);
});
