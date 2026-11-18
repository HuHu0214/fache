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
          className="text-xs text-[var(--muted)] underline-offset-4 hover:underline"
        >
          ← 返回首页
        </Link>
        <h2 className="text-2xl font-semibold tracking-tight">
          {law.title}
        </h2>
        <p className="text-xs text-[var(--muted)]">
          施行日期：{law.effectiveAt} · 收录 {law.articleCount} 条
        </p>
        {law.note && (
          <p className="text-xs text-[var(--muted)]">{law.note}</p>
        )}
      </header>

      {[...groups.entries()].map(([path, group]) => (
        <section key={path} className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--muted)]">
            {path}
          </h3>
          <ul className="space-y-1">
            {group.map((article) => (
              <li key={article.articleNo}>
                <Link
                  to={`/law/${id}/${encodeURIComponent(article.articleNo)}`}
                  className="flex gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] dark:hover:bg-white/5"
                >
                  <span className="w-24 shrink-0 text-[var(--accent)]">
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
