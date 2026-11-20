import {
  advanceLawProgress,
  buildDueCurve,
  buildStageCounts,
  computeStreakFromDays,
  createFirstLawProgress,
  daysUntilDue,
  isDue,
  MAX_STAGE,
  stageInfo,
} from '../../src/lib/ebbinghaus';

const day = (value: string) => new Date(`${value}T09:00:00`);

test('首次学习进入第 1 阶，次日到期', () => {
  const record = createFirstLawProgress(
    'civil-code',
    '第一条',
    day('2026-11-20'),
  );
  expect(record.stage).toBe(1);
  expect(record.learnCount).toBe(1);
  expect(record.studyDays).toEqual(['2026-11-20']);
  expect(daysUntilDue(record, day('2026-11-20'))).toBe(1);
  expect(isDue(record, day('2026-11-21'))).toBe(true);
});

test('再次学习按阶段推进间隔', () => {
  let record = createFirstLawProgress(
    'civil-code',
    '第一条',
    day('2026-11-20'),
  );
  record = advanceLawProgress(
    record,
    'civil-code',
    '第一条',
    day('2026-11-21'),
  );
  expect(record.stage).toBe(2);
  expect(record.learnCount).toBe(2);
  expect(record.studyDays).toEqual(['2026-11-20', '2026-11-21']);
  expect(stageInfo(record.stage).intervalDays).toBe(2);

  for (let index = 0; index < 20; index += 1) {
    record = advanceLawProgress(
      record,
      'civil-code',
      '第一条',
      day('2026-11-22'),
    );
  }
  expect(record.stage).toBe(MAX_STAGE);
  expect(record.learnCount).toBe(22);
});

test('阶段统计与未来到期曲线', () => {
  const first = createFirstLawProgress(
    'civil-code',
    '第一条',
    day('2026-11-20'),
  );
  const second = createFirstLawProgress(
    'civil-code',
    '第二条',
    day('2026-11-20'),
  );
  expect(buildStageCounts([first, second])).toEqual([
    2, 0, 0, 0, 0, 0, 0,
  ]);

  const curve = buildDueCurve(
    [first, second],
    day('2026-11-20'),
    3,
  );
  expect(curve.map((bucket) => bucket.count)).toEqual([0, 2, 0]);
});

test('连续学习天数由学习日期并集计算', () => {
  expect(
    computeStreakFromDays(
      ['2026-11-20', '2026-11-19', '2026-11-18'],
      day('2026-11-20'),
    ),
  ).toBe(3);
  expect(
    computeStreakFromDays(
      ['2026-11-20', '2026-11-18'],
      day('2026-11-20'),
      ['2026-11-19'],
    ),
  ).toBe(3);
  expect(
    computeStreakFromDays(['2026-11-18'], day('2026-11-20')),
  ).toBe(0);
});
