import { Link, useParams } from 'react-router-dom';
import { getArticles, getLaw } from '../../content/registry';

export type LawPageProps = {
  lawId?: string;
};

export default function LawPage({ lawId }: LawPageProps) {
  const params = useParams();
  const id = lawId ?? params.lawId ?? '';
  const law = getLaw(id);

  if (!law) {
    return <p className="text-sm text-[var(--muted)]">找不到这部法律。</p>;
  }

  const articles = getArticles(id);
  const groups = new Map<string, typeof articles>();

  for (const article of articles) {
    const key = article.path.join(' / ') || '正文';
    const group = groups.get(key);
    if (group) {
      group.push(article);
    } else {
      groups.set(key, [article]);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link
          to="/"
          className="font-mono text-[10px] tracking-[0.14em] text-[var(--muted)] hover:text-[var(--accent)]"
        >
          ← 返回首页
        </Link>
        <h2 className="text-2xl font-semibold tracking-tight">
          {law.title}
        </h2>
        <p className="font-mono text-[10px] tracking-[0.1em] text-[var(--muted)]">
          施行日期：{law.effectiveAt} · 收录 {law.articleCount} 条
        </p>
        {law.note && (
          <p className="font-mono text-[10px] text-[var(--muted)]">
            {law.note}
          </p>
        )}
      </header>

      {[...groups.entries()].map(([path, group]) => (
        <section key={path} className="space-y-2">
          <h3 className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-[var(--muted)]">
            <span
              className="h-2.5 w-1 bg-[var(--accent)]"
              aria-hidden="true"
            />
            {path}
          </h3>
          <ul className="space-y-1">
            {group.map((article) => (
              <li key={article.articleNo}>
                <Link
                  to={`/law/${id}/${encodeURIComponent(article.articleNo)}`}
                  className="flex gap-3 rounded-[2px] border border-transparent px-2 py-1.5 text-sm hover:border-[var(--line)] hover:bg-[var(--accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <span className="w-24 shrink-0 font-mono text-[11px] text-[var(--amber)]">
                    {article.articleNo}
                  </span>
                  <span className="truncate text-[var(--muted)]">
                    {article.text.slice(0, 48)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
