import { useState, type ChangeEvent } from 'react';
import { Button } from '../../components/ui/button';
import { db } from '../../lib/db';
import { cn } from '../../lib/cn';
import { playClick } from '../../lib/sound';
import { scheduleSqliteSave } from '../../lib/sqlite-sync';
import { exportBackup, importBackup } from './backup';
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
  const [soundOn, setSoundOn] = useState(
    () => localStorage.getItem('fajing.sound') !== '0',
  );

  const markExported = () => {
    localStorage.setItem('fajing.exported', '1');
  };

  const toggleSound = () => {
    const next = !soundOn;
    localStorage.setItem('fajing.sound', next ? '1' : '0');
    setSoundOn(next);
    if (next) {
      playClick();
    }
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
        scheduleSqliteSave();
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
        db.lawProgress.clear(),
      ]);
      localStorage.removeItem('fajing.exported');
      scheduleSqliteSave();
      setMessage('档案已清除。');
    })();
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="hud-label">[ SETTINGS ]</p>
        <h2 className="text-3xl font-black tracking-tight">设置</h2>
      </header>

      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-black">
          <span
            className="h-3 w-1 bg-[var(--amber)]"
            aria-hidden="true"
          />
          外观
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={theme === option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                'border-2 px-3 py-3 font-mono text-[11px] font-bold tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                theme === option.value
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'border-[var(--line)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--ink)]',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={soundOn}
          onClick={toggleSound}
          className={cn(
            'w-full border-2 px-3 py-2 font-mono text-[11px] font-bold tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
            soundOn
              ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
              : 'border-[var(--line)] bg-[var(--card)] text-[var(--muted)]',
          )}
        >
          音效：{soundOn ? '开' : '关'}
        </button>
      </section>

      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-black">
          <span
            className="h-3 w-1 bg-[var(--accent)]"
            aria-hidden="true"
          />
          卷宗管理
        </h3>
        <p className="text-xs leading-6 text-[var(--muted)]">
          学习阶段、到期时间与连续记录保存在本机浏览器。建议定期导出备份。
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" onClick={handleExport}>
            封存档案（JSON）
          </Button>
          <label className="inline-flex h-10 cursor-pointer items-center justify-center border-2 border-[var(--line)] bg-[var(--card)] px-4 text-sm font-bold hover:border-[var(--accent)] hover:text-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]">
            载入存档
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
              className="sr-only"
            />
          </label>
          <Button
            variant="danger"
            onClick={handleClear}
            className="sm:col-span-2"
          >
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
