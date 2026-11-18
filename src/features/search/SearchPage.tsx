import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { getThemes } from '../../content/registry';
import {
  buildSearchIndex,
  collectSearchDocs,
  searchContent,
  type SearchDoc,
  type SearchFilter,
} from '../../lib/search';

const typeLabels: Record<SearchDoc['type'], string> = {
  scenario: '场景',
  concept: '知识点',
  article: '法条',
};

function hrefFor(doc: SearchDoc): string {
  if (doc.type === 'scenario') {
    return `/scenario/${doc.id}`;
  }
  if (doc.type === 'concept') {
    return `/concept/${doc.id}`;
  }
  return `/law/${doc.lawId}/${encodeURIComponent(doc.articleNo ?? '')}`;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [themeId, setThemeId] = useState('');

  const index = useMemo(
    () => buildSearchIndex(collectSearchDocs()),
    [],
  );
  const results = searchContent(index, query, filter, {
    themeId: themeId || undefined,
  });

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">搜索</h2>
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜场景、知识点或法条，例如「试用期」「押金」"
          aria-label="搜索内容"
        />
        <div className="flex flex-wrap gap-2 text-sm">
          <select
            aria-label="按类型筛选"
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as SearchFilter)
            }
            className="h-9 rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 text-sm"
          >
            <option value="all">全部类型</option>
            <option value="scenario">场景</option>
            <option value="concept">知识点</option>
            <option value="article">法条</option>
          </select>
          <select
            aria-label="按主题筛选"
            value={themeId}
            onChange={(event) => setThemeId(event.target.value)}
            className="h-9 rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 text-sm"
          >
            <option value="">全部主题</option>
            {getThemes().map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.title}
              </option>
            ))}
          </select>
          <span className="self-center text-xs text-[var(--muted)]">
            {query.trim() ? `${results.length} 条结果` : ''}
          </span>
        </div>
      </header>

      {query.trim() && results.length === 0 && (
        <p className="text-sm text-[var(--muted)]">
          没有找到相关内容，换个词试试。
        </p>
      )}

      <ul className="space-y-2">
        {results.map((doc) => (
          <li key={`${doc.type}:${doc.id}`}>
            <Link
              to={hrefFor(doc)}
              className="block rounded-lg border border-[var(--line)] bg-[var(--card)] px-4 py-3 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <div className="flex items-center gap-2">
                <Badge tone="muted">{typeLabels[doc.type]}</Badge>
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
