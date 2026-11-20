import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
} from 'react-router-dom';
import { BootOverlay } from '../components/BootOverlay';
import { Disclaimer } from '../components/Disclaimer';
import { LevelUpOverlay } from '../components/LevelUpOverlay';
import { cn } from '../lib/cn';
import { buildReviewQueue } from '../features/review/queue';
import { computeProfile } from '../features/settings/profile';
import { useProfileData } from '../features/settings/useProfileData';
import { useTheme } from '../features/settings/useTheme';

const navItems = [
  { to: '/', label: '首页', end: true },
  { to: '/review', label: '复习' },
  { to: '/search', label: '搜索' },
  { to: '/notes', label: '笔记' },
  { to: '/settings', label: '设置' },
];

export default function AppLayout() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const { progress, stats } = useProfileData();
  const dueCount = buildReviewQueue(progress, new Date()).length;
  const profile = computeProfile(stats);

  const previousLevel = useRef<number | null>(null);
  const [levelUp, setLevelUp] = useState<{
    level: number;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (previousLevel.current === null) {
      previousLevel.current = profile.level;
      return;
    }
    if (profile.level > previousLevel.current) {
      setLevelUp({
        level: profile.level,
        title: profile.title,
      });
    }
    previousLevel.current = profile.level;
  }, [profile.level, profile.title]);

  const dismissLevelUp = useCallback(() => setLevelUp(null), []);

  const isReading =
    /^\/(scenario|concept|law)/.test(location.pathname) ||
    location.pathname === '/review';

  return (
    <div
      className={cn(
        'min-h-dvh',
        isReading ? 'surface-reading' : 'surface-notice',
      )}
    >
      <header className="border-b-[3px] border-[var(--line)] bg-[var(--paper)]">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <Link
            to="/"
            className="flex items-baseline gap-2 focus-visible:outline-none"
          >
            <h1 className="text-xl font-black tracking-tight">法径</h1>
            <span
              className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--muted)]"
              aria-hidden="true"
            >
              法律学习
            </span>
          </Link>

          <nav
            aria-label="主导航"
            className="flex flex-wrap gap-1 font-mono text-[10px] uppercase tracking-[0.12em]"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'border-2 border-transparent px-2 py-1 text-[var(--muted)] transition-colors hover:border-[var(--line)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]',
                    isActive &&
                      'border-[var(--line)] bg-[var(--accent)] text-[var(--on-accent)]',
                  )
                }
              >
                {item.label}
                {item.to === '/review' && dueCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="ml-1 border border-[var(--line)] bg-[var(--pink)] px-1 text-[9px] text-[var(--ink)]"
                  >
                    {dueCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            aria-label="切换深色模式"
            onClick={() =>
              setTheme(theme === 'dark' ? 'light' : 'dark')
            }
            className="ml-auto border-2 border-[var(--line)] bg-[var(--card)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-[var(--pink-soft)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]"
          >
            {theme === 'dark' ? '浅色' : '深色'}
          </button>
        </div>
      </header>

      <main className="page-shell mx-auto w-full max-w-3xl px-4 py-8">
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>

      <footer className="mx-auto mt-8 max-w-3xl border-t-[3px] border-[var(--line)] bg-[var(--band-bg)] px-4 py-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--band-fg)]">
        仅供学习，不构成法律意见。
      </footer>

      <Disclaimer />
      <BootOverlay />
      {levelUp && (
        <LevelUpOverlay
          level={levelUp.level}
          title={levelUp.title}
          onDone={dismissLevelUp}
        />
      )}
    </div>
  );
}
