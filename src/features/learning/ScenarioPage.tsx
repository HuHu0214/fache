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
            className="text-xs text-[var(--muted)] underline-offset-4 hover:underline"
          >
            ← {theme.title}
          </Link>
        )}
        <h2 className="text-2xl font-semibold tracking-tight">
          {entry.meta.title}
        </h2>
        <p className="rounded-xl border-l-2 border-[var(--accent)] bg-[var(--card)] px-4 py-3 text-sm leading-7">
          {entry.meta.hook}
        </p>
        {entry.meta.thinkPrompt && (
          <p className="text-sm text-[var(--muted)]">
            {entry.meta.thinkPrompt}
          </p>
        )}
        <p className="text-xs text-[var(--muted)]">
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
              <h3 className="text-sm font-medium">涉及的法条</h3>
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
          <h3 className="text-sm font-medium">笔记与收藏</h3>
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
