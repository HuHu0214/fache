import { buildGlobalPath } from '../../src/features/home/path';

const units = [
  { themeId: 'contracts', scenarioIds: ['a', 'b'] },
  { themeId: 'marriage', scenarioIds: ['c'] },
];

const rated = (scenarioId: string) => ({
  scenarioId,
  readAt: '2026-11-20T00:00:00.000Z',
  rated: true,
});

test('没有进度时只有第一个场景是当前节点', () => {
  expect(buildGlobalPath(units, [], [])).toEqual([
    { kind: 'scenario', id: 'a', themeId: 'contracts', status: 'current' },
    { kind: 'scenario', id: 'b', themeId: 'contracts', status: 'locked' },
    { kind: 'boss', id: 'boss:contracts', themeId: 'contracts', status: 'locked' },
    { kind: 'scenario', id: 'c', themeId: 'marriage', status: 'locked' },
    { kind: 'boss', id: 'boss:marriage', themeId: 'marriage', status: 'locked' },
  ]);
});

test('章节场景全通关后 Boss 才是当前节点', () => {
  const path = buildGlobalPath(
    units,
    [rated('a'), rated('b')],
    [],
  );
  expect(path[2]).toMatchObject({
    kind: 'boss',
    id: 'boss:contracts',
    status: 'current',
  });
  expect(path[3].status).toBe('locked');
});

test('Boss 通关后下一章首个场景解锁', () => {
  const path = buildGlobalPath(
    units,
    [rated('a'), rated('b')],
    ['contracts'],
  );
  expect(path[3]).toEqual({
    kind: 'scenario',
    id: 'c',
    themeId: 'marriage',
    status: 'current',
  });
});
