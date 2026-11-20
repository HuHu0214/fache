import { useEffect, useState } from 'react';
import type { TargetType } from '../../lib/db';
import { isBookmarked, toggleBookmark } from './bookmarks-repo';

export type BookmarkButtonProps = {
  targetType: TargetType;
  targetId: string;
};

export function BookmarkButton({
  targetType,
  targetId,
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void isBookmarked(targetType, targetId).then((value) => {
      if (!cancelled) {
        setBookmarked(value);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [targetType, targetId]);

  return (
    <button
      type="button"
      aria-pressed={bookmarked}
      onClick={() => {
        void toggleBookmark(targetType, targetId).then(setBookmarked);
      }}
      className="border-2 border-[var(--line)] bg-[var(--card)] px-3 py-1 font-mono text-[10px] font-bold tracking-[0.1em] text-[var(--ink)] hover:bg-[var(--pink-soft)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]"
    >
      {bookmarked ? '已收藏' : '收藏'}
    </button>
  );
}
