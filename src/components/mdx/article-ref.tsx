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
        className="my-2 block border-2 border-[var(--danger)] bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]"
      >
        法条缺失：{law} {no}
      </span>
    );
  }

  return (
    <details className="hud-panel my-3 border-l-[9px] border-l-[var(--accent)] p-[var(--space-3)] text-sm">
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent)]">
        <span>法条原文 · {lawMeta?.shortTitle ?? law} · {no}</span>
        <span className="border-2 border-[var(--line)] bg-[var(--accent)] px-2 py-0.5 text-[9px] text-[var(--on-accent)]">
          展开
        </span>
      </summary>
      <p className="mt-2 whitespace-pre-wrap break-words leading-7">
        {article.text}
      </p>
      <Link
        to={`/law/${law}/${no}`}
        className="mt-2 inline-block font-mono text-[10px] tracking-[0.1em] text-[var(--muted)] hover:text-[var(--accent)]"
      >
        在法条库中打开
      </Link>
    </details>
  );
}
