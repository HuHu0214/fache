import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getLaw,
  loadArticles,
} from '../../content/registry';
import type { LawArticle } from '../../content/schema';
import { formatDue, isDue, stageInfo } from '../../lib/ebbinghaus';
import { ArticleStudyControl } from './ArticleStudyControl';
import {
  markLawArticle,
  useLawProgress,
} from './law-progress-repo';

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
  const progressRecords = useLawProgress(id);
  const [loaded, setLoaded] = useState<{
    id: string;
    articles: LawArticle[] | null;
    error: string;
  } | null>(null);

  useEffect(() => {
    let active = true;

    loadArticles(id)
      .then((articles) => {
        if (active) {
          setLoaded({ id, articles, error: '' });
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setLoaded({
            id,
            articles: null,
            error:
              reason instanceof Error
                ? reason.message
                : '法律文本加载失败',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  const current = loaded?.id === id ? loaded : null;
  const articles = current?.articles ?? null;
  const error = current?.error ?? '';

  if (!law) {
    return <p className="text-sm text-[var(--muted)]">找不到这部法律。</p>;
  }

  if (error) {
    return (
      <p
        role="alert"
        className="border-2 border-[var(--danger)] bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]"
      >
        {error}
      </p>
    );
  }

  if (articles === null) {
    return (
      <p className="text-sm text-[var(--muted)]" aria-busy="true">
        正在加载条文…
      </p>
    );
  }

  const article = articles.find((item) => item.articleNo === no);

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

  const index = articles.findIndex(
    (item) => item.articleNo === article.articleNo,
  );
  const previous = index > 0 ? articles[index - 1] : undefined;
  const next =
    index >= 0 && index < articles.length - 1
      ? articles[index + 1]
      : undefined;

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap gap-4">
          <Link
            to={`/law/${id}`}
            className="font-mono text-[10px] tracking-[0.14em] text-[var(--muted)] hover:text-[var(--accent)]"
          >
            ← {law.title}
          </Link>
          <Link
            to="/laws"
            className="font-mono text-[10px] tracking-[0.14em] text-[var(--muted)] hover:text-[var(--accent)]"
          >
            全部法律
          </Link>
        </div>
        <h2 className="text-3xl font-black tracking-tight">
          {article.articleNo}
        </h2>
        {article.path.length > 0 && (
          <p className="font-mono text-[10px] tracking-[0.1em] text-[var(--muted)]">
            {article.path.join(' / ')}
          </p>
        )}
      </header>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <p className="hud-label">法条原文</p>
          {(() => {
            const record = progressRecords.find(
              (item) => item.articleNo === article.articleNo,
            );
            return (
              <>
                <ArticleStudyControl
                  articleNo={article.articleNo}
                  progress={record}
                  onMark={() =>
                    void markLawArticle(id, article.articleNo)
                  }
                />
                {record ? (
                  <span className="font-mono text-[10px] text-[var(--muted)]">
                    第{record.stage}阶 · {stageInfo(record.stage).label} ·{' '}
                    {isDue(record) ? '今日加深' : formatDue(record)} · 已学{' '}
                    {record.learnCount} 次
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-[var(--muted)]">
                    未学
                  </span>
                )}
              </>
            );
          })()}
        </div>
        <p className="hud-panel whitespace-pre-wrap break-words p-5 text-[15px] leading-8">
          {article.text}
        </p>
      </section>

      <dl className="grid gap-2 font-mono text-[10px] tracking-[0.08em] text-[var(--muted)]">
        <div className="flex gap-3">
          <dt className="w-16 shrink-0">法律</dt>
          <dd>{law.title}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-16 shrink-0">施行</dt>
          <dd>{law.effectiveAt}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-16 shrink-0">来源</dt>
          <dd>
            <a
              href={law.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--accent)] underline decoration-2 underline-offset-2"
            >
              国家法律法规数据库
            </a>
          </dd>
        </div>
      </dl>

      <nav
        aria-label="相邻条文"
        className="grid gap-2 border-t-2 border-[var(--line)] pt-4 sm:grid-cols-2"
      >
        {previous ? (
          <Link
            to={`/law/${id}/${encodeURIComponent(previous.articleNo)}`}
            className="border-2 border-[var(--line)] bg-[var(--card)] p-3 text-sm hover:bg-[var(--accent-soft)]"
          >
            <span className="hud-label block">上一条</span>
            <span className="mt-1 block font-bold">
              {previous.articleNo}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={`/law/${id}/${encodeURIComponent(next.articleNo)}`}
            className="border-2 border-[var(--line)] bg-[var(--card)] p-3 text-sm hover:bg-[var(--accent-soft)] sm:text-right"
          >
            <span className="hud-label block">下一条</span>
            <span className="mt-1 block font-bold">{next.articleNo}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
