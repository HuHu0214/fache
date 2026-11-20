import { cn } from '../../lib/cn';
import type { LawProgress } from '../../lib/db';
import { formatDue, isDue, stageInfo } from '../../lib/ebbinghaus';
import { ArticleStudyControl } from './ArticleStudyControl';

export type ArticleStudyRowProps = {
  articleNo: string;
  text: string;
  progress?: LawProgress;
  onMark: () => Promise<void> | void;
  anchorId?: string;
  className?: string;
};

export function ArticleStudyRow({
  articleNo,
  text,
  progress,
  onMark,
  anchorId,
  className,
}: ArticleStudyRowProps) {
  const due = progress ? isDue(progress) : false;
  const stage = progress ? stageInfo(progress.stage) : null;

  return (
    <article
      id={anchorId}
      className={cn('grid scroll-mt-24 grid-cols-[28px_minmax(0,1fr)] gap-3', className)}
    >
      <div className="pt-0.5">
        <ArticleStudyControl
          articleNo={articleNo}
          progress={progress}
          onMark={onMark}
        />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-[11px] font-bold text-[var(--accent)]">
            {articleNo}
          </p>
          {progress ? (
            <>
              <span className="border border-[var(--line)] bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[var(--accent)]">
                第{progress.stage}阶 · {stage?.label}
              </span>
              <span
                className={cn(
                  'font-mono text-[9px]',
                  due
                    ? 'font-bold text-[var(--danger)]'
                    : 'text-[var(--muted)]',
                )}
              >
                {due ? '今日加深' : formatDue(progress)}
              </span>
              <span className="font-mono text-[9px] text-[var(--muted)]">
                已学 {progress.learnCount} 次
              </span>
            </>
          ) : (
            <span className="font-mono text-[9px] text-[var(--muted)]">
              未学
            </span>
          )}
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-8 text-[var(--ink)]">
          {text}
        </p>
      </div>
    </article>
  );
}
