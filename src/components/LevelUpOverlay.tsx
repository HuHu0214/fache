import { useEffect } from 'react';
import { playLevelUp } from '../lib/sound';
import { ParticleBurst } from './ParticleBurst';

export type LevelUpOverlayProps = {
  level: number;
  title: string;
  onDone: () => void;
};

export function LevelUpOverlay({
  level,
  title,
  onDone,
}: LevelUpOverlayProps) {
  useEffect(() => {
    playLevelUp();
    const timer = setTimeout(onDone, 2600);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onDone}
      className="fixed inset-0 z-[65] grid cursor-pointer place-items-center bg-black/70 backdrop-blur-sm"
    >
      <ParticleBurst count={36} />
      <div className="relative text-center">
        <div className="level-burst" aria-hidden="true" />
        <p className="hud-label tracking-[0.4em] text-[var(--amber)]">
          [ LEVEL UP ]
        </p>
        <p className="mt-2 font-mono text-6xl font-semibold text-[var(--accent)] [text-shadow:0_0_30px_rgba(0,229,255,0.6)]">
          {level}
        </p>
        <p className="mt-1 text-lg text-[var(--ink)]">{title}</p>
        <p className="mt-3 font-mono text-[10px] tracking-[0.18em] text-[var(--muted)]">
          点击任意位置继续
        </p>
      </div>
    </div>
  );
}
