import { useState, type ComponentType } from 'react';
import { Link, useParams } from 'react-router-dom';
import { mdxComponents } from '../../components/mdx';
import { Reveal } from '../../components/mdx/reveal';
import { ArticleRef } from '../../components/mdx/article-ref';
import { BookmarkButton } from '../bookmarks/BookmarkButton';
import { NoteEditor } from '../notes/NoteEditor';
import { getScenario, getTheme } from '../../content/registry';
import type { RatingInput } from '../../lib/db';
import { markScenarioRead, markScenarioRated } from './reads-repo';
import { RatingButtons } from './rating-buttons';
import { rateKnowledgePoint, touchKnowledgePoint } from './rating';

type AnswerContent = ComponentType<{
  components: Record<string, unknown>;
}>;

export type ScenarioPageProps = {
  scenarioId?: string;
};

export default function ScenarioPage({ scenarioId }: ScenarioPageProps) {
  const params = useParams();
  const id = scenarioId ?? params.scenarioId ?? '';
  const entry = getScenario(id);
  const [revealed, setRevealed] = useState(false);
  const [rated, setRated] = useState(false);

  if (!entry) {
    return <p className="text-sm text-[var(--muted)]">找不到这个场景。</p>;
  }

  const theme = getTheme(entry.meta.themeId);
  const Answer = entry.Content as unknown as AnswerContent;

  const handleReveal = (open: boolean) => {
    setRevealed(open);
    if (!open) {
      return;
    }
    void markScenarioRead(entry.meta.id);
    for (const kpId of entry.meta.kpIds) {
      if (kpId !== entry.meta.primaryKpId) {
        void touchKnowledgePoint(kpId);
      }
    }
  };

  const handleRate = (rating: RatingInput) => {
    void (async () => {
      await rateKnowledgePoint(entry.meta.primaryKpId, rating);
      await markScenarioRated(entry.meta.id);
      setRated(true);
    })();
  };

  return (
    <article className="page-shell space-y-6">
      <div className="space-y-2">
        {theme && (
          <Link
            to={`/theme/${theme.id}`}
            className="font-mono text-[10px] tracking-[0.14em] text-[var(--muted)] hover:text-[var(--accent)]"
          >
            ← {theme.title}
          </Link>
        )}
        <h2 className="text-2xl font-semibold tracking-tight">
          {entry.meta.title}
        </h2>
        <p className="hud-panel border-l-2 border-l-[var(--accent)] px-4 py-3 text-sm leading-7">
          {entry.meta.hook}
        </p>
        {entry.meta.thinkPrompt && (
          <p className="font-mono text-[11px] leading-6 text-[var(--amber)]">
            {entry.meta.thinkPrompt}
          </p>
        )}
        <p className="font-mono text-[10px] tracking-[0.1em] text-[var(--muted)]">
          约 {entry.meta.estimatedMinutes} 分钟
        </p>
      </div>

      <Reveal label="我想好了，展开答案" onOpenChange={handleReveal}>
        <div className="text-[15px] leading-8">
          <Answer components={mdxComponents} />
        </div>
      </Reveal>

      {revealed && (
        <section className="space-y-4 border-t border-[var(--line)] pt-5">
          {entry.meta.articleRefs.length > 0 && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <span
                  className="h-2.5 w-1 bg-[var(--accent)]"
                  aria-hidden="true"
                />
                涉及的法条
              </h3>
              {entry.meta.articleRefs.map((ref) => (
                <ArticleRef
                  key={`${ref.lawId}-${ref.articleNo}`}
                  law={ref.lawId}
                  no={ref.articleNo}
                />
              ))}
            </div>
          )}

          {rated ? (
            <p className="text-sm text-[var(--muted)]">已加入复习</p>
          ) : (
            <RatingButtons onRate={handleRate} />
          )}
        </section>
      )}

      <section className="space-y-3 border-t border-[var(--line)] pt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="hud-label">笔记与收藏</h3>
          <BookmarkButton
            targetType="scenario"
            targetId={entry.meta.id}
          />
        </div>
        <NoteEditor
          key={`scenario:${entry.meta.id}`}
          targetType="scenario"
          targetId={entry.meta.id}
        />
      </section>
    </article>
  );
}
