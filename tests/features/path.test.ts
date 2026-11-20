import { buildThemePath } from '../../src/features/home/path';

const reads = [
  { scenarioId: 'a', readAt: '2026-11-20T00:00:00.000Z', rated: true },
  { scenarioId: 'b', readAt: '2026-11-20T00:00:00.000Z', rated: false },
];

test('第一个未完成节点是当前节点，之后锁定', () => {
  expect(buildThemePath(['a', 'b', 'c'], reads)).toEqual([
    { id: 'a', status: 'complete' },
    { id: 'b', status: 'current' },
    { id: 'c', status: 'locked' },
  ]);
});

test('只读完未自评不算通关', () => {
  expect(buildThemePath(['b', 'c'], reads)[0]).toEqual({
    id: 'b',
    status: 'current',
  });
});

test('全部通关后没有当前节点', () => {
  const all = [
    { scenarioId: 'a', readAt: '2026-11-20T00:00:00.000Z', rated: true },
    { scenarioId: 'b', readAt: '2026-11-20T00:00:00.000Z', rated: true },
  ];
  expect(buildThemePath(['a', 'b'], all)).toEqual([
    { id: 'a', status: 'complete' },
    { id: 'b', status: 'complete' },
  ]);
});
