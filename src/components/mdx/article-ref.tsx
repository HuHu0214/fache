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
    <details className="my-2 rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-sm">
      <summary className="cursor-pointer text-[var(--accent)]">
        {lawMeta?.shortTitle ?? law} · {no}
      </summary>
      <p className="mt-2 whitespace-pre-wrap leading-7">{article.text}</p>
      <Link
        to={`/law/${law}/${no}`}
        className="mt-2 inline-block text-xs text-[var(--muted)] underline underline-offset-4"
      >
        查看法条
      </Link>
    </details>
  );
}
