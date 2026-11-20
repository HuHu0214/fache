import type { ComponentType } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArticleRef } from '../../components/mdx/article-ref';
import { ConceptLink } from '../../components/mdx/concept-link';
import { mdxComponents } from '../../components/mdx';
import {
  getKnowledgePoint,
  getTheme,
} from '../../content/registry';
import type { RatingInput } from '../../lib/db';
import { ButtonLink } from '../../components/ui/button';
import { BookmarkButton } from '../bookmarks/BookmarkButton';
import { NoteEditor } from '../notes/NoteEditor';
import { rateKnowledgePoint } from './rating';
import { RatingButtons } from './rating-buttons';

type BodyContent = ComponentType<{
  components: Record<string, unknown>;
}>;

export type KnowledgePointPageProps = {
  kpId?: string;
};

export default function KnowledgePointPage({
  kpId,
}: KnowledgePointPageProps) {
  const params = useParams();
  const id = kpId ?? params.kpId ?? '';
  const entry = getKnowledgePoint(id);

  if (!entry) {
    return <p className="text-sm text-[var(--muted)]">找不到这个知识点。</p>;
  }

  const theme = getTheme(entry.meta.themeId);
  const Body = entry.Content as unknown as BodyContent;

  const handleRate = (rating: RatingInput) => {
    void rateKnowledgePoint(entry.meta.id, rating);
  };

  return (
    <article className="space-y-6">
      <div className="space-y-2">
        {theme && (
          <Link
            to={`/theme/${theme.id}`}
            className="font-mono text-[10px] tracking-[0.14em] text-[var(--muted)] hover:text-[var(--accent)]"
          >
            ← {theme.title}
          </Link>
        )}
        <h2 className="text-3xl font-black tracking-tight">
          {entry.meta.title}
        </h2>
        <p className="hud-panel px-4 py-3 text-sm leading-7">
          {entry.meta.oneLiner}
        </p>
        {entry.meta.articleRefs[0] && (
          <ButtonLink
            to={`/law/${entry.meta.articleRefs[0].lawId}/${encodeURIComponent(entry.meta.articleRefs[0].articleNo)}`}
            variant="outline"
            size="sm"
            className="w-fit"
          >
            查看法条原文
          </ButtonLink>
        )}
      </div>

      <div className="text-[15px] leading-8">
        <Body components={mdxComponents} />
      </div>

      {entry.meta.articleRefs.length > 0 && (
        <section className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-black">
            <span
              className="h-2.5 w-1 bg-[var(--accent)]"
              aria-hidden="true"
            />
            法条原文
          </h3>
          {entry.meta.articleRefs.map((ref) => (
            <ArticleRef
              key={`${ref.lawId}-${ref.articleNo}`}
              law={ref.lawId}
              no={ref.articleNo}
            />
          ))}
        </section>
      )}

      {entry.meta.confusions.length > 0 && (
        <section className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-black">
            <span
              className="h-2.5 w-1 bg-[var(--amber)]"
              aria-hidden="true"
            />
            容易混淆
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-7">
            {entry.meta.confusions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {entry.meta.relatedKpIds.length > 0 && (
        <section className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-black">
            <span
              className="h-2.5 w-1 bg-[var(--accent)]"
              aria-hidden="true"
            />
            相关概念
          </h3>
          <div className="flex flex-wrap gap-3 text-sm">
            {entry.meta.relatedKpIds.map((relatedId) => (
              <ConceptLink key={relatedId} id={relatedId} />
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-[var(--line)] pt-5">
        <RatingButtons onRate={handleRate} />
      </section>

      <section className="space-y-3 border-t border-[var(--line)] pt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="hud-label">笔记与收藏</h3>
          <BookmarkButton targetType="kp" targetId={entry.meta.id} />
        </div>
        <NoteEditor
          key={`kp:${entry.meta.id}`}
          targetType="kp"
          targetId={entry.meta.id}
        />
      </section>
    </article>
  );
}
