import {
  scheduleProgress,
  dueProgress,
} from '../../src/lib/review';

const now = new Date('2026-11-18T00:00:00.000Z');

test('首次自评创建卡片并排到未来', () => {
  const p = scheduleProgress(undefined, 'kp-1', 'good', now);
  expect(p.state).toBe('learning');
  expect(new Date(p.card!.due).getTime()).toBeGreaterThan(
    now.getTime(),
  );
});

test('没懂比很熟更早到期', () => {
  const again = scheduleProgress(undefined, 'kp-1', 'again', now);
  const easy = scheduleProgress(undefined, 'kp-1', 'easy', now);
  expect(new Date(again.card!.due).getTime()).toBeLessThan(
    new Date(easy.card!.due).getTime(),
  );
});

test('连续很熟间隔变长', () => {
  const first = scheduleProgress(undefined, 'kp-1', 'easy', now);
  const second = scheduleProgress(
    first,
    'kp-1',
    'easy',
    new Date(first.card!.due),
  );
  const firstDays =
    new Date(first.card!.due).getTime() - now.getTime();
  const secondDays =
    new Date(second.card!.due).getTime() -
    new Date(first.card!.due).getTime();
  expect(secondDays).toBeGreaterThan(firstDays);
});

test('dueProgress 只返回到期卡片', () => {
  const due = scheduleProgress(
    undefined,
    'a',
    'again',
    new Date('2026-11-01T00:00:00.000Z'),
  );
  const future = scheduleProgress(undefined, 'b', 'easy', now);
  expect(dueProgress([due, future], now).map((p) => p.kpId)).toEqual([
    'a',
  ]);
});
