import { useLiveQuery } from 'dexie-react-hooks';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Disclaimer } from '../components/Disclaimer';
import { db } from '../lib/db';
import { cn } from '../lib/cn';
import { buildReviewQueue } from '../features/review/queue';
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
  const progress = useLiveQuery(() => db.progress.toArray(), []) ?? [];
  const dueCount = buildReviewQueue(progress, new Date()).length;

  return (
    <div className="min-h-dvh">
      <header className="border-b border-[var(--line)] bg-[var(--bg)]/85 shadow-[0_1px_0_var(--accent-soft)] backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4">
          <Link to="/" className="focus-visible:outline-none">
            <h1 className="font-mono text-xl font-semibold tracking-[0.32em] text-[var(--accent)] [text-shadow:0_0_18px_rgba(0,229,255,0.35)]">
              法径
            </h1>
          </Link>

          <nav
            aria-label="主导航"
            className="flex flex-wrap gap-3 font-mono text-[11px] tracking-[0.18em]"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-[2px] border border-transparent px-1.5 py-1 text-[var(--muted)] transition-colors hover:border-[var(--line)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                    isActive &&
                      'border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]',
                  )
                }
              >
                {item.label}
                {item.to === '/review' && dueCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="ml-1 text-[10px] text-[var(--amber)]"
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
            className="ml-auto rounded-[2px] border border-[var(--line-strong)] px-2 py-1 font-mono text-[10px] tracking-[0.15em] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            {theme === 'dark' ? '浅色' : '深色'}
          </button>
        </div>
      </header>

      <main className="page-shell mx-auto w-full max-w-3xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-3xl px-4 pb-10 font-mono text-[10px] tracking-[0.14em] text-[var(--muted)]">
        仅供学习，不构成法律意见。
      </footer>

      <Disclaimer />
    </div>
  );
}
