import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
} from 'react-router-dom';
import { BootOverlay } from '../components/BootOverlay';
import { DesktopZoom } from '../components/DesktopZoom';
import { Disclaimer } from '../components/Disclaimer';
import { LevelUpOverlay } from '../components/LevelUpOverlay';
import { cn } from '../lib/cn';
import { computeProfile } from '../features/settings/profile';
import { useProfileData } from '../features/settings/useProfileData';
import { useTheme } from '../features/settings/useTheme';

const navItems = [
  { to: '/', label: '首页', end: true },
  { to: '/laws', label: '法律' },
  { to: '/settings', label: '设置' },
];

export default function AppLayout() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const { stats } = useProfileData();
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

  const isHome = location.pathname === '/';
  const isReading =
    /^\/law(\/|$)/.test(location.pathname) ||
    location.pathname === '/study';
  const isWide =
    isHome ||
    /^\/(laws?|study)(\/|$)/.test(location.pathname);
  const frameWidth = isWide ? 'max-w-[1500px]' : 'max-w-6xl';

  return (
    <div
      className={cn(
        'min-h-dvh',
        isReading ? 'surface-reading' : 'surface-notice',
      )}
    >
      <header className="border-b-[3px] border-[var(--line)] bg-[var(--paper)]">
        <div
          className={cn(
            'mx-auto flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3',
            frameWidth,
          )}
        >
          <Link
            to="/"
            className="flex items-baseline gap-2 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]"
          >
            <h1 className="text-xl font-black tracking-tight">法册</h1>
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
                    (isActive ||
                      (item.to === '/laws' &&
                        /^\/(laws?|study)(\/|$)/.test(
                          location.pathname,
                        ))) &&
                      'border-[var(--line)] bg-[var(--accent)] text-[var(--on-accent)]',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <DesktopZoom />
            <button
              type="button"
              aria-label={
                theme === 'dark' ? '切换浅色模式' : '切换深色模式'
              }
              onClick={() =>
                setTheme(theme === 'dark' ? 'light' : 'dark')
              }
              className="border-2 border-[var(--line)] bg-[var(--card)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-[var(--pink-soft)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]"
            >
              {theme === 'dark' ? '浅色' : '深色'}
            </button>
          </div>
        </div>
      </header>

      <main
        className={cn(
          'page-shell mx-auto w-full px-4 py-8',
          isWide
            ? 'max-w-[1500px]'
            : isReading
              ? 'max-w-4xl'
              : 'max-w-6xl',
        )}
      >
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>

      <footer
        className={cn(
          'mx-auto mt-8 border-t-[3px] border-[var(--line)] bg-[var(--band-bg)] px-4 py-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--band-fg)]',
          frameWidth,
        )}
      >
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
