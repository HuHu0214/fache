import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { localDateKey, shiftDays } from '../../lib/date';
import type { Setting } from '../../lib/db';
import { streakXpPerDay } from '../settings/profile';
import { freezeTokens, consumeStreakFreeze } from './streak-freeze';

export type StreakPanelProps = {
  streak: number;
  studyDays: string[];
  setting?: Setting;
};

export function StreakPanel({
  streak,
  studyDays,
  setting,
}: StreakPanelProps) {
  const [message, setMessage] = useState('');
  const tokens = freezeTokens(setting);
  const frozen = new Set(setting?.frozenDates ?? []);
  const readDays = new Set(studyDays);
  const now = new Date();
  const yesterday = localDateKey(shiftDays(now, -1));
  const dayBefore = localDateKey(shiftDays(now, -2));

  const gap =
    tokens > 0 &&
    !readDays.has(yesterday) &&
    !frozen.has(yesterday) &&
    (readDays.has(dayBefore) || frozen.has(dayBefore));

  const handleFreeze = () => {
    void (async () => {
      const result = await consumeStreakFreeze();
      setMessage(
        result.ok
          ? '已用护符补签昨天，连续记录保住了。'
          : '没有可用护符。',
      );
    })();
  };

  return (
    <section className="hud-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="hud-label">[ STREAK ] 连续打卡</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-[var(--accent)]">
            {streak} 天
          </p>
          <p className="mt-1 font-mono text-[10px] tracking-[0.08em] text-[var(--muted)]">
            每天 +{streakXpPerDay(streak)} 阅历 · 护符 ×
            {tokens}
          </p>
        </div>
        {gap && (
          <Button
            size="sm"
            title="使用一枚护符补签昨天，连续记录不断。"
            onClick={handleFreeze}
          >
            断签保护
          </Button>
        )}
      </div>
      {message && (
        <p className="mt-2 text-xs text-[var(--accent)]">
          {message}
        </p>
      )}
    </section>
  );
}
