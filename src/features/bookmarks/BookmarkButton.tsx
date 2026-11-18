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
      className="rounded-md border border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      {bookmarked ? '已收藏' : '收藏'}
    </button>
  );
}
