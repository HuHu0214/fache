import {
  computeThemeProgress,
  computeStreak,
} from '../../src/features/learning/theme-progress';

test('空数据返回零进度', () => {
  expect(
    computeThemeProgress({
      scenarioIds: ['a'],
      kpIds: ['k1'],
      readScenarioIds: [],
      progress: [],
    }),
  ).toEqual({
    scenariosRead: 0,
    scenariosTotal: 1,
    kpsMastered: 0,
    kpsTotal: 1,
  });
});

test('已读与已掌握分别计数', () => {
  const p = computeThemeProgress({
    scenarioIds: ['a', 'b'],
    kpIds: ['k1', 'k2'],
    readScenarioIds: ['a'],
    progress: [
      {
        kpId: 'k1',
        state: 'review',
        updatedAt: '2026-11-18T00:00:00.000Z',
      },
    ],
  });
  expect(p.scenariosRead).toBe(1);
  expect(p.kpsMastered).toBe(1);
});

test('连续学习天数按日期去重计算', () => {
  const reads = [
    { scenarioId: 'a', readAt: '2026-11-18T09:00:00.000Z', rated: true },
    { scenarioId: 'b', readAt: '2026-11-18T20:00:00.000Z', rated: true },
    { scenarioId: 'c', readAt: '2026-11-17T09:00:00.000Z', rated: true },
  ];
  expect(
    computeStreak(reads, new Date('2026-11-18T12:00:00.000Z')),
  ).toBe(2);
});
