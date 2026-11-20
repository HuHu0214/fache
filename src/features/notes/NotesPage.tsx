import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import {
  getKnowledgePoint,
  getScenario,
} from '../../content/registry';
import type { TargetType } from '../../lib/db';
import { listBookmarks } from '../bookmarks/bookmarks-repo';
import { listNotes } from './notes-repo';

function targetMeta(targetType: TargetType, targetId: string) {
  if (targetType === 'scenario') {
    const entry = getScenario(targetId);
    return {
      title: entry?.meta.title ?? targetId,
      to: `/scenario/${targetId}`,
    };
  }
  const entry = getKnowledgePoint(targetId);
  return {
    title: entry?.meta.title ?? targetId,
    to: `/concept/${targetId}`,
  };
}

export default function NotesPage() {
  const notes = useLiveQuery(() => listNotes(), []) ?? [];
  const bookmarks = useLiveQuery(() => listBookmarks(), []) ?? [];

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="hud-label">[ NOTES ]</p>
        <h2 className="text-3xl font-black tracking-tight">我的笔记</h2>
        {notes.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            还没有笔记，学习时随手记一句。
          </p>
        ) : (
          <ul className="space-y-2">
            {notes.map((note) => {
              const meta = targetMeta(note.targetType, note.targetId);
              return (
                <li key={note.id}>
                  <Link
                    to={meta.to}
                    className="hud-panel block px-4 py-3 transition-colors hover:border-[var(--accent)] hover:shadow-[0_0_24px_-14px_var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium">
                        {meta.title}
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.08em] text-[var(--muted)]">
                        {note.updatedAt.slice(0, 10)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                      {note.content}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <p className="hud-label">[ BOOKMARKS ]</p>
        <h2 className="text-3xl font-black tracking-tight">收藏</h2>
        {bookmarks.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            还没有收藏，遇到想反复看的内容就收起来。
          </p>
        ) : (
          <ul className="space-y-2">
            {bookmarks.map((bookmark) => {
              const meta = targetMeta(
                bookmark.targetType,
                bookmark.targetId,
              );
              return (
                <li key={bookmark.id}>
                  <Link
                    to={meta.to}
                    className="hud-panel block px-4 py-3 text-sm transition-colors hover:border-[var(--accent)] hover:shadow-[0_0_24px_-14px_var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    {meta.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
