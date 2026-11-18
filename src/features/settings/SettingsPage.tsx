import { useState, type ChangeEvent } from 'react';
import { Button } from '../../components/ui/button';
import { db } from '../../lib/db';
import { useTheme, type ThemeMode } from './useTheme';
import {
  exportBackup,
  exportNotesMarkdown,
  importBackup,
} from './backup';

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

  const handleExport = () => {
    void (async () => {
      const backup = await exportBackup();
      const date = new Date().toISOString().slice(0, 10);
      download(
        `fajing-backup-${date}.json`,
        JSON.stringify(backup, null, 2),
        'application/json',
      );
      setMessage('备份已导出。');
    })();
  };

  const handleExportNotes = () => {
    void (async () => {
      const markdown = await exportNotesMarkdown();
      download('fajing-notes.md', markdown, 'text/markdown');
      setMessage('笔记已导出。');
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
            '导入会覆盖当前全部学习数据，确定继续吗？',
          )
        ) {
          return;
        }
        await importBackup(parsed);
        setMessage('数据已导入。');
      } catch {
        setMessage('导入失败：文件格式不正确。');
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
      setMessage('数据已清除。');
    })();
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">设置</h2>
        <p className="text-sm text-[var(--muted)]">
          数据只存在本机浏览器里，不会上传到任何服务器。
        </p>
      </header>

      <section className="space-y-3">
        <h3 className="text-sm font-medium">外观</h3>
        <label className="flex items-center gap-3 text-sm">
          主题
          <select
            value={theme}
            onChange={(event) =>
              setTheme(event.target.value as ThemeMode)
            }
            className="h-9 rounded-lg border border-[var(--line)] bg-[var(--card)] px-2"
          >
            <option value="system">跟随系统</option>
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </label>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium">数据备份</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExport}>
            导出数据
          </Button>
          <Button variant="outline" onClick={handleExportNotes}>
            导出笔记 Markdown
          </Button>
          <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-[var(--line)] bg-[var(--card)] px-4 text-sm font-medium hover:bg-black/5 focus-within:ring-2 focus-within:ring-[var(--accent)] dark:hover:bg-white/5">
            导入数据
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
              className="sr-only"
            />
          </label>
        </div>
        {message && (
          <p className="text-xs text-[var(--muted)]">{message}</p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium">危险操作</h3>
        <Button variant="danger" onClick={handleClear}>
          清除全部数据
        </Button>
      </section>
    </div>
  );
}
