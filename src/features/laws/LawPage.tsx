import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { Button, ButtonLink } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import {
  getLaw,
  loadArticles,
} from '../../content/registry';
import type { LawArticle } from '../../content/schema';
import { ArticleStudyRow } from './ArticleStudyRow';
import {
  markLawArticle,
  markLawArticlesLearned,
  useLawProgress,
} from './law-progress-repo';

export type LawPageProps = {
  lawId?: string;
};

function chapterId(index: number): string {
  return `chapter-${index}`;
}

function articleAnchor(articleNo: string): string {
  return `article-${articleNo}`;
}

export default function LawPage({ lawId }: LawPageProps) {
  const params = useParams();
  const id = lawId ?? params.lawId ?? '';
  const law = getLaw(id);
  const progressRecords = useLawProgress(id);
  const progressByNo = new Map(
    progressRecords.map((record) => [record.articleNo, record]),
  );
  const [loaded, setLoaded] = useState<{
    id: string;
    articles: LawArticle[] | null;
    error: string;
  } | null>(null);
  const [message, setMessage] = useState('');
  const [confirmBatch, setConfirmBatch] = useState(false);

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
  const learnedCount = articles
    ? articles.filter((article) =>
        progressByNo.has(article.articleNo),
      ).length
    : progressRecords.length;
  const unlearnedArticles = (articles ?? []).filter(
    (article) => !progressByNo.has(article.articleNo),
  );

  const handleMark = async (articleNo: string) => {
    const record = await markLawArticle(id, articleNo);
    setMessage(
      `已记录 ${record.articleNo}：第 ${record.stage} 阶，${record.learnCount} 次学习。`,
    );
  };

  const handleMarkAll = async () => {
    const count = await markLawArticlesLearned(
      id,
      unlearnedArticles.map((article) => article.articleNo),
    );
    setConfirmBatch(false);
    setMessage(
      count > 0
        ? `已将 ${count} 条未学法条标记为第 1 阶。`
        : '当前没有未学法条。',
    );
  };

  if (!law) {
    return <p className="text-sm text-[var(--muted)]">找不到这部法律。</p>;
  }

  const groups = new Map<string, LawArticle[]>();
  for (const article of articles ?? []) {
    const key = article.path.join(' / ') || '正文';
    const group = groups.get(key);
    if (group) {
      group.push(article);
    } else {
      groups.set(key, [article]);
    }
  }

  const sections = [...groups.entries()].map(
    ([path, group], index) => ({
      id: chapterId(index),
      path,
      group,
    }),
  );

  const directory = (
    <ul className="space-y-1">
      {sections.map((section, index) => (
        <li key={section.id}>
          <details open={index === 0}>
            <summary className="cursor-pointer border-2 border-transparent px-2 py-1 text-xs font-bold hover:border-[var(--line)] hover:text-[var(--accent)]">
              {section.path}
              <span className="ml-1 font-mono text-[9px] font-normal text-[var(--muted)]">
                {section.group.length}
              </span>
            </summary>
            <div className="mb-2 mt-1 grid grid-cols-3 gap-1 pl-2">
              {section.group.map((article) => {
                const learned = progressByNo.has(article.articleNo);
                return (
                  <a
                    key={article.articleNo}
                    href={`#${articleAnchor(article.articleNo)}`}
                    aria-label={`${article.articleNo}${learned ? '，已学' : ''}`}
                    className={`border border-[var(--line)] px-1 py-0.5 text-center font-mono text-[9px] ${
                      learned
                        ? 'bg-[var(--accent-soft)] font-bold text-[var(--accent)]'
                        : 'text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]'
                    }`}
                  >
                    {article.articleNo.replace(/^第|条$/g, '')}
                  </a>
                );
              })}
            </div>
          </details>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Link
          to="/laws"
          className="font-mono text-[10px] tracking-[0.14em] text-[var(--muted)] hover:text-[var(--accent)]"
        >
          ← 全部法律
        </Link>
        <h2 className="text-3xl font-black tracking-tight">
          {law.title}
        </h2>
        <p className="font-mono text-[10px] tracking-[0.1em] text-[var(--muted)]">
          {law.category && `${law.category} · `}
          施行：{law.effectiveAt} · 收录 {law.articleCount} 条
        </p>
        {law.note && (
          <p className="font-mono text-[10px] text-[var(--muted)]">
            {law.note}
          </p>
        )}

        <div className="flex flex-wrap items-end justify-between gap-4 border-y-2 border-[var(--line)] py-3">
          <div className="min-w-48 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="hud-label">学习进度</p>
              <p className="font-mono text-[10px] text-[var(--accent)]">
                {learnedCount}/{law.articleCount}
              </p>
            </div>
            <Progress
              value={
                law.articleCount === 0
                  ? 0
                  : (learnedCount / law.articleCount) * 100
              }
              className="mt-2"
              label={`${law.title}学习进度`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink
              to={`/study?mode=whole&law=${law.id}`}
              variant="outline"
              size="sm"
            >
              整部学习
            </ButtonLink>
            <ButtonLink to="/study?mode=random" size="sm">
              随机抽条
            </ButtonLink>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {articles && unlearnedArticles.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmBatch(true)}
            >
              标记全部未学（{unlearnedArticles.length}）
            </Button>
          )}
          {message && (
            <p
              aria-live="polite"
              className="font-mono text-[10px] text-[var(--muted)]"
            >
              {message}
            </p>
          )}
        </div>

        {confirmBatch && (
          <div className="border-2 border-[var(--line)] bg-[var(--accent-soft)] p-3">
            <p className="text-sm font-bold">
              将这部法律剩余的 {unlearnedArticles.length} 条未学法条标记为第 1 阶？
            </p>
            <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
              已学过的法条不会被改动；此操作会为每条新法条安排 1 天后的复习。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void handleMarkAll()}>
                确认标记
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmBatch(false)}
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </header>

      {error && (
        <p
          role="alert"
          className="border-2 border-[var(--danger)] bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]"
        >
          {error}
        </p>
      )}

      {articles === null && !error && (
        <p className="text-sm text-[var(--muted)]" aria-busy="true">
          正在加载全文…
        </p>
      )}

      {articles !== null && articles.length === 0 && (
        <p className="text-sm text-[var(--muted)]">这部法律暂无可显示条文。</p>
      )}

      {articles !== null && articles.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <nav
              aria-label="法律目录"
              className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto border-2 border-[var(--line)] bg-[var(--card)] p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="hud-label">条文目录</p>
                <Badge tone="muted">{learnedCount} 已学</Badge>
              </div>
              {directory}
            </nav>
          </aside>

          <div className="min-w-0 space-y-8">
            <details className="hud-panel p-3 lg:hidden">
              <summary className="hud-label">
                条文目录 / {sections.length} 章
              </summary>
              <div className="mt-2">{directory}</div>
            </details>

            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 space-y-4"
              >
                <h3 className="flex items-center gap-2 border-b-2 border-[var(--line)] pb-1 text-sm font-black">
                  <span
                    className="h-2.5 w-1 bg-[var(--accent)]"
                    aria-hidden="true"
                  />
                  {section.path}
                </h3>

                <div className="space-y-5">
                  {section.group.map((article) => (
                    <ArticleStudyRow
                      key={article.articleNo}
                      anchorId={articleAnchor(article.articleNo)}
                      articleNo={article.articleNo}
                      text={article.text}
                      progress={progressByNo.get(article.articleNo)}
                      onMark={() => handleMark(article.articleNo)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
