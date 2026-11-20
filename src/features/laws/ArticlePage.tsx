import { Link, useParams } from 'react-router-dom';
import { getArticle, getLaw } from '../../content/registry';

export type ArticlePageProps = {
  lawId?: string;
  articleNo?: string;
};

export default function ArticlePage({
  lawId,
  articleNo,
}: ArticlePageProps) {
  const params = useParams();
  const id = lawId ?? params.lawId ?? '';
  const no = articleNo ?? params.articleNo ?? '';
  const law = getLaw(id);
  const article = getArticle(id, no);

  if (!law) {
    return <p className="text-sm text-[var(--muted)]">找不到这部法律。</p>;
  }

  if (!article) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--muted)]">
          未收录该条：{law.title} {no}
        </p>
        <Link
          to={`/law/${id}`}
          className="text-sm text-[var(--accent)] underline underline-offset-4"
        >
          返回法律目录
        </Link>
      </div>
    );
  }

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <Link
          to={`/law/${id}`}
          className="font-mono text-[10px] tracking-[0.14em] text-[var(--muted)] hover:text-[var(--accent)]"
        >
          ← {law.title}
        </Link>
        <h2 className="text-2xl font-semibold tracking-tight">
          {article.articleNo}
        </h2>
        {article.path.length > 0 && (
          <p className="font-mono text-[10px] tracking-[0.1em] text-[var(--muted)]">
            {article.path.join(' / ')}
          </p>
        )}
      </header>

      <p className="hud-panel whitespace-pre-wrap break-words px-5 py-4 text-[15px] leading-8">
        {article.text}
      </p>

      <dl className="grid gap-2 font-mono text-[10px] tracking-[0.08em] text-[var(--muted)]">
        <div className="flex gap-3">
          <dt className="w-16 shrink-0">法律</dt>
          <dd>{law.title}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-16 shrink-0">施行日期</dt>
          <dd>{law.effectiveAt}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-16 shrink-0">来源</dt>
          <dd>
            <a
              href={law.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--accent)] underline decoration-[var(--accent)]/40 underline-offset-4"
            >
              国家法律法规数据库
            </a>
          </dd>
        </div>
      </dl>
    </article>
  );
}
