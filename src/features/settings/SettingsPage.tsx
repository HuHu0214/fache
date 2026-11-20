import { useLiveQuery } from 'dexie-react-hooks';
import { useState, type ChangeEvent } from 'react';
import { Button } from '../../components/ui/button';
import { db } from '../../lib/db';
import { cn } from '../../lib/cn';
import { computeStreak } from '../learning/theme-progress';
import {
  computeAchievements,
  computeProfile,
} from './profile';
import {
  exportBackup,
  exportNotesMarkdown,
  importBackup,
} from './backup';
import { useTheme, type ThemeMode } from './useTheme';

const themeOptions: Array<{ value: ThemeMode; label: string }> = [
  { value: 'system', label: '随系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
];

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [message, setMessage] = useState('');
  const [exported, setExported] = useState(
    () => localStorage.getItem('fajing.exported') === '1',
  );

  const reads = useLiveQuery(() => db.reads.toArray(), []) ?? [];
  const progress =
    useLiveQuery(() => db.progress.toArray(), []) ?? [];
  const notes = useLiveQuery(() => db.notes.toArray(), []) ?? [];
  const bookmarks =
    useLiveQuery(() => db.bookmarks.toArray(), []) ?? [];

  const stats = {
    scenariosRead: reads.length,
    kpsMastered: progress.filter((item) => item.state === 'review')
      .length,
    notes: notes.length,
    bookmarks: bookmarks.length,
    streak: computeStreak(reads, new Date()),
  };
  const profile = computeProfile(stats);
  const achievements = computeAchievements(stats, { exported });
  const unlocked = achievements.filter((item) => item.unlocked).length;

  const markExported = () => {
    localStorage.setItem('fajing.exported', '1');
    setExported(true);
  };

  const handleExport = () => {
    void (async () => {
      const backup = await exportBackup();
      const date = new Date().toISOString().slice(0, 10);
      download(
        `fajing-backup-${date}.json`,
        JSON.stringify(backup, null, 2),
        'application/json',
      );
      markExported();
      setMessage('档案已封存（JSON 导出完成）。');
    })();
  };

  const handleExportNotes = () => {
    void (async () => {
      const markdown = await exportNotesMarkdown();
      download('fajing-notes.md', markdown, 'text/markdown');
      setMessage('笔记已抄录为 Markdown。');
    })();
  };

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    void (async () => {
      const text = await file.text();
      try {
        const parsed: unknown = JSON.parse(text);
        if (
          !window.confirm(
            '载入存档会覆盖当前全部学习数据，确定继续吗？',
          )
        ) {
          return;
        }
        await importBackup(parsed);
        setMessage('存档已载入。');
      } catch {
        setMessage('载入失败：文件格式不正确。');
      }
    })();
    event.target.value = '';
  };

  const handleClear = () => {
    if (!window.confirm('确定清除全部学习数据吗？此操作不可撤销。')) {
      return;
    }
    void (async () => {
      await Promise.all([
        db.progress.clear(),
        db.notes.clear(),
        db.bookmarks.clear(),
        db.reads.clear(),
        db.settings.clear(),
      ]);
      localStorage.removeItem('fajing.exported');
      setExported(false);
      setMessage('档案已清除。');
    })();
  };

  const ringLength = 2 * Math.PI * 42;
  const dashOffset =
    ringLength - (ringLength * profile.percent) / 100;

  return (
    <div className="space-y-8">
      <section className="level-card relative overflow-hidden rounded-2xl p-5 sm:p-7">
        <div className="level-grid" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="relative h-28 w-28 shrink-0">
            <svg
              viewBox="0 0 100 100"
              className="h-full w-full -rotate-90"
              aria-hidden="true"
            >
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                strokeWidth="6"
                className="level-ring-track"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={ringLength}
                strokeDashoffset={dashOffset}
                className="level-ring-value"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <span className="block text-3xl font-semibold text-[#f6ead4]">
                  {profile.level}
                </span>
                <span className="text-[10px] tracking-[0.35em] text-white/50">
                  LV
                </span>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] tracking-[0.35em] text-white/45">
              法修档案
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[#f6ead4]">
              {profile.title}
            </h2>
            <p className="mt-1 text-xs leading-6 text-white/60">
              {profile.xp} 阅历
              {profile.nextTitle
                ? ` · 距「${profile.nextTitle}」还差 ${profile.xpToNext}`
                : ' · 已至最高阶'}
            </p>
          </div>

          <div className="seal" aria-hidden="true">
            法
          </div>
        </div>

        <dl className="relative mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ['场景', stats.scenariosRead],
            ['掌握', stats.kpsMastered],
            ['笔记', stats.notes],
            ['连续', `${stats.streak} 天`],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            >
              <dt className="text-[10px] tracking-[0.2em] text-white/45">
                {label}
              </dt>
              <dd className="mt-0.5 text-lg font-medium text-[#f6ead4]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-lg font-medium">成就</h3>
          <span className="text-xs text-[var(--muted)]">
            {unlocked}/{achievements.length} 已解锁
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {achievements.map((item) => (
            <div
              key={item.id}
              className={cn(
                'achievement rounded-xl border bg-[var(--card)] p-3',
                item.unlocked
                  ? 'border-[var(--accent)]/35'
                  : 'border-[var(--line)] opacity-55',
              )}
            >
              <div
                className={cn(
                  'seal-sm',
                  item.unlocked ? 'seal-unlocked' : 'seal-locked',
                )}
                aria-hidden="true"
              >
                {item.mark}
              </div>
              <p className="mt-2 text-sm font-medium">{item.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">
                {item.description}
              </p>
              <p className="mt-1 text-[10px] tracking-[0.15em] text-[var(--muted)]">
                {item.unlocked ? '已解锁' : '未解锁'}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-medium">外观</h3>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={theme === option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                'rounded-xl border px-3 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                theme === option.value
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] font-medium'
                  : 'border-[var(--line)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--ink)]',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-medium">卷宗管理</h3>
        <p className="text-xs leading-6 text-[var(--muted)]">
          学习数据只存在本机浏览器。建议定期封存一份 JSON 存档。
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" onClick={handleExport}>
            封存档案（JSON）
          </Button>
          <Button variant="outline" onClick={handleExportNotes}>
            抄录笔记（Markdown）
          </Button>
          <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--card)] px-4 text-sm font-medium hover:bg-black/5 focus-within:ring-2 focus-within:ring-[var(--accent)] dark:hover:bg-white/5">
            载入存档
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
              className="sr-only"
            />
          </label>
          <Button variant="danger" onClick={handleClear}>
            清除档案
          </Button>
        </div>
        {message && (
          <p className="text-xs text-[var(--muted)]">{message}</p>
        )}
      </section>
    </div>
  );
}
