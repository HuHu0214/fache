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
            className="text-xs text-[var(--muted)] underline-offset-4 hover:underline"
          >
            ← {theme.title}
          </Link>
        )}
        <h2 className="text-2xl font-semibold tracking-tight">
          {entry.meta.title}
        </h2>
        <p className="rounded-lg bg-[var(--card)] px-4 py-3 text-sm leading-7">
          {entry.meta.oneLiner}
        </p>
      </div>

      <div className="text-[15px] leading-8">
        <Body components={mdxComponents} />
      </div>

      {entry.meta.articleRefs.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium">法条原文</h3>
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
          <h3 className="text-sm font-medium">容易混淆</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-7">
            {entry.meta.confusions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {entry.meta.relatedKpIds.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium">相关概念</h3>
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
    </article>
  );
}
