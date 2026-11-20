import { Link } from 'react-router-dom';
import { getArticle, getLaw } from '../../content/registry';

export type ArticleRefProps = {
  law: string;
  no: string;
};

export function ArticleRef({ law, no }: ArticleRefProps) {
  const article = getArticle(law, no);
  const lawMeta = getLaw(law);

  if (!article) {
    return (
      <span
        role="alert"
        className="my-2 block rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700"
      >
        法条缺失：{law} {no}
      </span>
    );
  }

  return (
    <details className="hud-panel my-2 px-3 py-2 text-sm">
      <summary className="cursor-pointer font-mono text-[11px] tracking-[0.06em] text-[var(--accent)]">
        {lawMeta?.shortTitle ?? law} · {no}
      </summary>
      <p className="mt-2 whitespace-pre-wrap break-words leading-7">
        {article.text}
      </p>
      <Link
        to={`/law/${law}/${no}`}
        className="mt-2 inline-block font-mono text-[10px] tracking-[0.1em] text-[var(--muted)] hover:text-[var(--accent)]"
      >
        查看法条 →
      </Link>
    </details>
  );
}
