import type MiniSearch from 'minisearch';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { getThemes } from '../../content/registry';
import {
  buildSearchIndex,
  collectSearchDocs,
  getLawArticleIndex,
  searchContent,
  type SearchDoc,
  type SearchFilter,
} from '../../lib/search';

const typeLabels: Record<SearchDoc['type'], string> = {
  scenario: '场景',
  concept: '知识点',
  law: '法律',
  article: '法条',
};

function hrefFor(doc: SearchDoc): string {
  if (doc.type === 'scenario') {
    return `/scenario/${doc.entityId}`;
  }
  if (doc.type === 'concept') {
    return `/concept/${doc.entityId}`;
  }
  if (doc.type === 'law') {
    return `/law/${doc.entityId}`;
  }
  return `/law/${doc.lawId}/${encodeURIComponent(doc.articleNo ?? '')}`;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [themeId, setThemeId] = useState('');
  const [lawIndex, setLawIndex] = useState<
    MiniSearch<SearchDoc> | null
  >(null);
  const [lawIndexStarted, setLawIndexStarted] = useState(false);
  const [lawIndexError, setLawIndexError] = useState(false);

  const index = useMemo(
    () => buildSearchIndex(collectSearchDocs()),
    [],
  );

  const ensureLawIndex = () => {
    if (lawIndexStarted) {
      return;
    }
    setLawIndexStarted(true);
    getLawArticleIndex()
      .then(setLawIndex)
      .catch(() => setLawIndexError(true));
  };

  const results = useMemo(() => {
    if (!query.trim()) {
      return [];
    }

    const base = searchContent(index, query, filter, {
      themeId: themeId || undefined,
      limit: 20,
    });

    if (!lawIndex) {
      return base;
    }

    const seen = new Set(base.map((doc) => doc.id));
    const articles = searchContent(lawIndex, query, filter, {
      themeId: themeId || undefined,
      limit: 30,
    }).filter((doc) => !seen.has(doc.id));

    return [...base, ...articles].slice(0, 20);
  }, [filter, index, lawIndex, query, themeId]);

  const showLawIndexHint =
    Boolean(query.trim()) &&
    lawIndex === null &&
    !lawIndexError &&
    (filter === 'all' || filter === 'article');

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="hud-label">[ SEARCH INDEX ]</p>
        <h2 className="text-3xl font-black tracking-tight">搜索</h2>
        <Input
          type="search"
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            if (
              value.trim() &&
              filter !== 'scenario' &&
              filter !== 'concept'
            ) {
              ensureLawIndex();
            }
          }}
          placeholder="检索场景、知识点、法律或法条"
          aria-label="搜索内容"
        />
        <div className="flex flex-wrap gap-2 text-sm">
          <select
            aria-label="按类型筛选"
            value={filter}
            onChange={(event) => {
              const next = event.target.value as SearchFilter;
              setFilter(next);
              if (
                query.trim() &&
                (next === 'all' || next === 'article')
              ) {
                ensureLawIndex();
              }
            }}
            className="h-9 border-2 border-[var(--line)] bg-[var(--card)] px-2 font-mono text-[11px] tracking-[0.06em]"
          >
            <option value="all">全部类型</option>
            <option value="scenario">场景</option>
            <option value="concept">知识点</option>
            <option value="law">法律</option>
            <option value="article">法条</option>
          </select>
          <select
            aria-label="按主题筛选"
            value={themeId}
            onChange={(event) => setThemeId(event.target.value)}
            className="h-9 border-2 border-[var(--line)] bg-[var(--card)] px-2 font-mono text-[11px] tracking-[0.06em]"
          >
            <option value="">全部主题</option>
            {getThemes().map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.title}
              </option>
            ))}
          </select>
          <span className="self-center text-xs text-[var(--muted)]">
            {query.trim()
              ? results.length >= 20
                ? '前 20 条结果'
                : `${results.length} 条结果`
              : ''}
          </span>
        </div>
        {showLawIndexHint && (
          <p className="text-xs text-[var(--muted)]" aria-live="polite">
            法条索引建立中，法律与学习内容的结果已可检索。
          </p>
        )}
        {lawIndexError && (
          <p className="text-xs text-[var(--danger)]">
            法条索引建立失败，仅显示场景、知识点与法律目录。
          </p>
        )}
      </header>

      {query.trim() && results.length === 0 && !showLawIndexHint && (
        <p className="text-sm text-[var(--muted)]">无匹配结果。</p>
      )}

      <ul className="space-y-2">
        {results.map((doc) => (
          <li key={`${doc.type}:${doc.id}`}>
            <Link
              to={hrefFor(doc)}
              className="hud-panel block px-4 py-3 transition-colors hover:border-[var(--accent)] hover:shadow-[0_0_24px_-14px_var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <div className="flex items-center gap-2">
                <Badge
                  tone={
                    doc.type === 'article' || doc.type === 'law'
                      ? 'accent'
                      : 'muted'
                  }
                >
                  {typeLabels[doc.type]}
                </Badge>
                <span className="text-sm font-medium">{doc.title}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-6 text-[var(--muted)]">
                {doc.text}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
