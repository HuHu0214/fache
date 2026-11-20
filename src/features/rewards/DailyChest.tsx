import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { ParticleBurst } from '../../components/ParticleBurst';
import { Button } from '../../components/ui/button';
import { db } from '../../lib/db';
import { cn } from '../../lib/cn';
import { playChest } from '../../lib/sound';
import { localDateKey, openDailyChest } from './daily-chest';

export function DailyChest() {
  const setting = useLiveQuery(() => db.settings.get('app'), []);
  const [burst, setBurst] = useState(false);
  const [lastBonus, setLastBonus] = useState(0);

  const canOpen = setting?.lastChestAt !== localDateKey();

  const handleOpen = () => {
    void (async () => {
      const result = await openDailyChest();
      if (!result.opened) {
        return;
      }
      setLastBonus(result.bonus);
      setBurst(true);
      playChest();
      setTimeout(() => setBurst(false), 1100);
    })();
  };

  return (
    <section className="hud-panel relative overflow-hidden p-4">
      {burst && <ParticleBurst />}
      <div className="flex items-center gap-4">
        <svg
          viewBox="0 0 64 64"
          className={cn(
            'chest-icon h-14 w-14 shrink-0',
            canOpen && 'chest-ready',
          )}
          aria-hidden="true"
        >
          <path
            d="M8 28 Q8 14 32 14 Q56 14 56 28"
            fill="none"
            stroke="var(--amber)"
            strokeWidth="2"
          />
          <rect
            x="8"
            y="28"
            width="48"
            height="26"
            rx="2"
            fill="var(--amber-soft)"
            stroke="var(--amber)"
            strokeWidth="2"
          />
          <rect x="8" y="32" width="48" height="3" fill="var(--amber)" />
          <rect
            x="29"
            y="38"
            width="6"
            height="8"
            rx="1"
            fill="var(--amber)"
          />
          <circle cx="32" cy="42" r="1.5" fill="var(--bg)" />
        </svg>

        <div className="min-w-0 flex-1">
          <p className="hud-label">[ DAILY CACHE ] 每日宝箱</p>
          <p className="mt-1 text-sm">
            {canOpen
              ? '今日可开启：+20～30 阅历'
              : lastBonus > 0
                ? `今日已开启：+${lastBonus} 阅历`
                : '今日已开启，明天再来'}
          </p>
          <p className="mt-1 font-mono text-[10px] tracking-[0.08em] text-[var(--muted)]">
            宝箱累计 +{setting?.bonusXp ?? 0} 阅历
          </p>
        </div>

        <Button
          size="sm"
          variant={canOpen ? 'default' : 'outline'}
          disabled={!canOpen}
          onClick={handleOpen}
        >
          {canOpen ? '开启' : '已领取'}
        </Button>
      </div>
    </section>
  );
}
