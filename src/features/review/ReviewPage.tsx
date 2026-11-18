import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArticleRef } from '../../components/mdx/article-ref';
import { Button } from '../../components/ui/button';
import { getKnowledgePoint } from '../../content/registry';
import { db, type RatingInput } from '../../lib/db';
import { dueProgress } from '../../lib/review';
import { rateKnowledgePoint } from '../learning/rating';
import { RatingButtons } from '../learning/rating-buttons';

export default function ReviewPage() {
  const progress = useLiveQuery(() => db.progress.toArray(), []) ?? [];
  const [revealedKpId, setRevealedKpId] = useState<string | null>(
    null,
  );

  const queue = dueProgress(progress, new Date());
  const current = queue[0];
  const entry = current
    ? getKnowledgePoint(current.kpId)
    : undefined;
  const revealed =
    current !== undefined && revealedKpId === current.kpId;

  const handleRate = (rating: RatingInput) => {
    if (current) {
      void rateKnowledgePoint(current.kpId, rating);
    }
  };

  if (progress.length === 0 || queue.length === 0) {
    return (
      <div className="space-y-3 py-10 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          复习
        </h2>
        <p className="text-sm text-[var(--muted)]">
          今天没有要复习的，去主题里逛逛。
        </p>
      </div>
    );
  }

  if (!entry) {
    return (
      <p className="text-sm text-[var(--muted)]">
        找不到知识点 {current.kpId}。
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">复习</h2>
        <span className="text-xs text-[var(--muted)]">
          剩余 {queue.length} 张
        </span>
      </header>

      <section className="space-y-4 rounded-xl border border-[var(--line)] bg-[var(--card)] px-5 py-5">
        <h3 className="text-lg font-medium">{entry.meta.title}</h3>
        <p className="text-sm leading-7">{entry.meta.reviewPrompt}</p>

        {!revealed ? (
          <Button
            variant="outline"
            onClick={() => setRevealedKpId(current.kpId)}
          >
            显示答案
          </Button>
        ) : (
          <div className="space-y-4">
            <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--ink)]">
              {entry.meta.reviewAnswer}
            </p>

            {entry.meta.articleRefs.length > 0 && (
              <div className="space-y-2">
                {entry.meta.articleRefs.map((ref) => (
                  <ArticleRef
                    key={`${ref.lawId}-${ref.articleNo}`}
                    law={ref.lawId}
                    no={ref.articleNo}
                  />
                ))}
              </div>
            )}

            <RatingButtons key={current.kpId} onRate={handleRate} />
          </div>
        )}
      </section>
    </div>
  );
}
