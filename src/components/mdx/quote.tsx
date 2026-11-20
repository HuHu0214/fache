import { getArticle, getLaw } from '../../content/registry';

export type QuoteProps = {
  law: string;
  no: string;
};

export function Quote({ law, no }: QuoteProps) {
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
    <blockquote className="my-4 border-l-2 border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-2">
      <p className="whitespace-pre-wrap break-words text-sm leading-7">
        {article.text}
      </p>
      <cite className="mt-2 block font-mono text-[10px] not-italic tracking-[0.1em] text-[var(--muted)]">
        {lawMeta?.title ?? law} · {no}
      </cite>
    </blockquote>
  );
}
