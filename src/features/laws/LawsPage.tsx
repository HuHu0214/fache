import type MiniSearch from 'minisearch';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/input';
import { getLaw, getLaws } from '../../content/registry';
import {
  getLawArticleIndex,
  searchContent,
  type SearchDoc,
} from '../../lib/search';

export default function LawsPage() {
  const laws = getLaws();
  const [query, setQuery] = useState('');
  const [articleIndex, setArticleIndex] = useState<
    MiniSearch<SearchDoc> | null
  >(null);
  const [indexing, setIndexing] = useState(false);
  const [indexError, setIndexError] = useState(false);
  const articleTotal = laws.reduce(
    (sum, law) => sum + law.articleCount,
    0,
  );

  const ensureArticleIndex = () => {
    if (indexing || articleIndex || indexError) {
      return;
    }
    setIndexing(true);
    getLawArticleIndex()
      .then((loaded) => {
        setArticleIndex(loaded);
        setIndexing(false);
      })
      .catch(() => {
        setIndexError(true);
        setIndexing(false);
      });
  };

  const keyword = query.trim();
  const filtered = keyword
    ? laws.filter((law) =>
        `${law.title} ${law.shortTitle} ${law.category ?? ''}`.includes(
          keyword,
        ),
      )
    : laws;
  const articleResults = articleIndex
    ? searchContent(articleIndex, keyword, 'article', { limit: 20 })
    : [];
  const searchingFullText = keyword.length >= 2;

  const groups = new Map<string, typeof laws>();
  for (const law of filtered) {
    const key = law.category ?? '其他';
    const group = groups.get(key);
    if (group) {
      group.push(law);
    } else {
      groups.set(key, [law]);
    }
  }
  const grouped = [...groups.entries()];

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="hud-label">[ LAW LIBRARY ]</p>
        <h2 className="text-3xl font-black tracking-tight">法律原文</h2>
        <p className="text-sm leading-6 text-[var(--muted)]">
          收录 {laws.length} 部法律，共 {articleTotal.toLocaleString('zh-CN')} 条，条文来自国家法律法规数据库。
        </p>
        <Input
          type="search"
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            if (value.trim().length >= 2) {
              ensureArticleIndex();
            }
          }}
          placeholder="搜索法律名称或法条全文"
          aria-label="搜索法律或法条"
          className="max-w-xl"
        />
        {keyword && (
          <p className="font-mono text-[10px] text-[var(--muted)]">
            {filtered.length} 部法律匹配
            {searchingFullText &&
              (indexing
                ? ' · 法条索引建立中'
                : articleIndex
                  ? ` · ${articleResults.length} 条法条命中`
                  : indexError
                    ? ' · 法条索引建立失败'
                    : '')}
          </p>
        )}
      </header>

      {keyword && grouped.length === 0 && articleResults.length === 0 && (
        <p className="text-sm text-[var(--muted)]">
          {indexing ? '法条索引建立中…' : '没有匹配的法律或条文。'}
        </p>
      )}

      {grouped.map(([category, items]) => (
        <section key={category} className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-[var(--line)] pb-1">
            <h3 className="text-lg font-black">{category}</h3>
            <span className="font-mono text-[10px] text-[var(--muted)]">
              {items.length} 部
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((law) => (
              <Link
                key={law.id}
                to={`/law/${law.id}`}
                className="hud-panel block p-4 transition-transform hover:translate-x-[-2px] hover:translate-y-[-2px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-base font-black leading-6">
                    {law.title}
                  </h4>
                  <span className="font-mono text-[10px] text-[var(--muted)]">
                    {law.articleCount} 条
                  </span>
                </div>
                <p className="mt-2 font-mono text-[10px] tracking-[0.08em] text-[var(--muted)]">
                  施行 {law.effectiveAt}
                </p>
                {law.note && (
                  <p className="mt-1 font-mono text-[10px] leading-5 text-[var(--muted)]">
                    {law.note}
                  </p>
                )}
                <span className="mt-3 inline-block border-2 border-[var(--line)] bg-[var(--card)] px-3 py-1 font-mono text-[10px] font-bold text-[var(--accent)]">
                  阅读全文
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {searchingFullText && articleResults.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-2 border-b-2 border-[var(--line)] pb-1">
            <h3 className="text-lg font-black">法条全文</h3>
            <span className="font-mono text-[10px] text-[var(--muted)]">
              最多显示 20 条
            </span>
          </div>
          <ul className="space-y-2">
            {articleResults.map((doc) => {
              const law = getLaw(doc.lawId ?? '');
              return (
                <li key={doc.id}>
                  <Link
                    to={`/law/${doc.lawId}/${encodeURIComponent(
                      doc.articleNo ?? '',
                    )}`}
                    className="hud-panel block p-4 transition-colors hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="border-2 border-[var(--line)] bg-[var(--accent-soft)] px-2 py-0.5 font-mono text-[9px] font-bold text-[var(--accent)]">
                        {law?.shortTitle ?? doc.lawId}
                      </span>
                      <span className="font-mono text-[10px] font-bold">
                        {doc.articleNo}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-3 text-xs leading-6 text-[var(--muted)]">
                      {doc.text}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
