import { useState } from 'react';
import { cn } from '../../lib/cn';
import type { LawProgress } from '../../lib/db';

export type ArticleStudyControlProps = {
  articleNo: string;
  progress?: LawProgress;
  onMark: () => Promise<void> | void;
  className?: string;
};

export function ArticleStudyControl({
  articleNo,
  progress,
  onMark,
  className,
}: ArticleStudyControlProps) {
  const [pending, setPending] = useState(false);
  const learned = progress !== undefined;
  const nextStage = progress
    ? Math.min(7, progress.stage + 1)
    : 1;

  const handleClick = () => {
    if (pending) {
      return;
    }
    void (async () => {
      setPending(true);
      try {
        await onMark();
      } finally {
        setPending(false);
      }
    })();
  };

  return (
    <button
      type="button"
      aria-pressed={learned}
      aria-label={
        learned
          ? `${articleNo}已学第${progress.stage}阶，再学一次进入第${nextStage}阶`
          : `标记${articleNo}已学习`
      }
      title={
        learned
          ? '点击再学一次，进入更深的记忆阶段'
          : '标记已学习，开始艾宾浩斯排程'
      }
      disabled={pending}
      onClick={handleClick}
      className={cn(
        'grid h-5 w-5 shrink-0 place-items-center border-2 border-[var(--line)] font-mono text-[11px] font-bold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
        learned
          ? 'bg-[var(--accent)] text-[var(--on-accent)]'
          : 'bg-[var(--card)] text-transparent hover:bg-[var(--accent-soft)]',
        pending && 'opacity-50',
        className,
      )}
    >
      ✓
    </button>
  );
}
