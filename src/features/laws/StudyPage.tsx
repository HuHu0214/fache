import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { Button, ButtonLink } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import {
  getLaw,
  getLaws,
  loadArticles,
} from '../../content/registry';
import type { LawArticle } from '../../content/schema';
import type { LawProgress } from '../../lib/db';
import { isDue, stageInfo } from '../../lib/ebbinghaus';
import { ArticleStudyRow } from './ArticleStudyRow';
import {
  markLawArticle,
  markLawArticlesLearned,
  useLawProgress,
} from './law-progress-repo';

type Mode = 'random' | 'whole' | 'due';

type StudyGroup = {
  lawId: string;
  articles: LawArticle[];
};

const LAW_COUNTS = [1, 2, 3, 5] as const;
const ARTICLE_COUNTS = [1, 2, 3, 5, 10] as const;
const DUE_LIMIT = 30;

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

function progressKey(lawId: string, articleNo: string): string {
  return `${lawId}:${articleNo}`;
}

function modeFromParam(value: string | null): Mode {
  return value === 'whole' || value === 'due' ? value : 'random';
}

export default function StudyPage() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>(() =>
    modeFromParam(params.get('mode')),
  );
  const laws = getLaws();
  const lawById = new Map(laws.map((law) => [law.id, law]));
  const lawProgress = useLawProgress();
  const progressById = new Map(
    lawProgress.map((record) => [record.id, record]),
  );
  const [message, setMessage] = useState('');

  const learnedByLaw = new Map<string, number>();
  for (const record of lawProgress) {
    learnedByLaw.set(
      record.lawId,
      (learnedByLaw.get(record.lawId) ?? 0) + 1,
    );
  }

  const markOne = async (lawId: string, articleNo: string) => {
    const record = await markLawArticle(lawId, articleNo);
    setMessage(
      `${record.articleNo} 已进入第 ${record.stage} 阶（${stageInfo(record.stage).label}）。`,
    );
  };

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Link
          to="/laws"
          className="font-mono text-[10px] tracking-[0.14em] text-[var(--muted)] hover:text-[var(--accent)]"
        >
          ← 全部法律
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="hud-label">[ STUDY ] 法条学习</p>
            <h2 className="mt-1 text-3xl font-black tracking-tight">
              艾宾浩斯学习台
            </h2>
          </div>
          <p className="font-mono text-[10px] leading-6 text-[var(--muted)]">
            阶段间隔：1 / 2 / 4 / 7 / 15 / 30 / 60 天
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ['random', '随机抽条'],
            ['whole', '整部法律'],
            ['due', '到期加深'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value as Mode)}
              className={
                mode === value
                  ? 'border-2 border-[var(--line)] bg-[var(--accent)] px-4 py-2 font-mono text-[10px] font-bold tracking-[0.1em] text-[var(--on-accent)]'
                  : 'border-2 border-[var(--line)] bg-[var(--card)] px-4 py-2 font-mono text-[10px] font-bold tracking-[0.1em] text-[var(--muted)] hover:text-[var(--ink)]'
              }
            >
              {label}
            </button>
          ))}
        </div>
        {message && (
          <p aria-live="polite" className="text-xs text-[var(--accent)]">
            {message}
          </p>
        )}
      </header>

      {mode === 'random' && (
        <RandomStudy
          laws={laws}
          learnedByLaw={learnedByLaw}
          progressById={progressById}
          onMark={markOne}
        />
      )}
      {mode === 'whole' && (
        <WholeLawStudy
          laws={laws}
          lawById={lawById}
          progressById={progressById}
          initialLawId={params.get('law') ?? ''}
          onMark={markOne}
        />
      )}
      {mode === 'due' && (
        <DueStudy
          lawProgress={lawProgress}
          lawById={lawById}
          progressById={progressById}
          onMark={markOne}
        />
      )}
    </div>
  );
}

type RandomProps = {
  laws: ReturnType<typeof getLaws>;
  learnedByLaw: Map<string, number>;
  progressById: Map<string, LawProgress>;
  onMark: (lawId: string, articleNo: string) => Promise<void>;
};

function RandomStudy({
  laws,
  learnedByLaw,
  progressById,
  onMark,
}: RandomProps) {
  const [lawCount, setLawCount] = useState(2);
  const [perLaw, setPerLaw] = useState(3);
  const [onlyUnlearned, setOnlyUnlearned] = useState(true);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  const eligibleLaws = laws.filter(
    (law) =>
      !onlyUnlearned ||
      (learnedByLaw.get(law.id) ?? 0) < law.articleCount,
  );
  const effectiveLawCount = Math.min(lawCount, eligibleLaws.length);
  const totalPicked = groups.reduce(
    (sum, group) => sum + group.articles.length,
    0,
  );

  const draw = () => {
    void (async () => {
      setLoading(true);
      setNote('');
      try {
        const pickedLaws = shuffle(eligibleLaws).slice(
          0,
          Math.min(lawCount, eligibleLaws.length),
        );
        if (pickedLaws.length === 0) {
          setGroups([]);
          setNote(
            onlyUnlearned
              ? '没有剩余未学法条：可关闭“仅抽未学”，或到“到期加深”继续。'
              : '当前没有可抽取的法律。',
          );
          return;
        }

        const loaded = await Promise.all(
          pickedLaws.map(async (law) => ({
            law,
            articles: await loadArticles(law.id),
          })),
        );

        const nextGroups: StudyGroup[] = [];
        let shortLaws = 0;

        for (const item of loaded) {
          const learned = new Set(
            [...progressById.values()]
              .filter((record) => record.lawId === item.law.id)
              .map((record) => record.articleNo),
          );
          const candidates = onlyUnlearned
            ? item.articles.filter(
                (article) => !learned.has(article.articleNo),
              )
            : item.articles;
          if (candidates.length < perLaw) {
            shortLaws += 1;
          }
          const picked = shuffle(candidates).slice(0, perLaw);
          if (picked.length > 0) {
            nextGroups.push({
              lawId: item.law.id,
              articles: picked,
            });
          }
        }

        setGroups(nextGroups);
        const parts = [
          `抽出 ${nextGroups.length} 部法律、${nextGroups.reduce(
            (sum, group) => sum + group.articles.length,
            0,
          )} 条。`,
        ];
        if (effectiveLawCount < lawCount) {
          parts.push(
            `符合条件的法律只有 ${effectiveLawCount} 部，已按上限抽取。`,
          );
        }
        if (shortLaws > 0) {
          parts.push('部分法律不足所选条数，已取该法全部可用条文。');
        }
        setNote(parts.join(' '));
      } catch {
        setGroups([]);
        setNote('抽条失败，请重试。');
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className="space-y-5">
      <section className="hud-panel space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="space-y-1">
            <span className="hud-label">法律数量</span>
            <select
              value={lawCount}
              onChange={(event) =>
                setLawCount(Number(event.target.value))
              }
              className="h-10 w-full border-2 border-[var(--line)] bg-[var(--card)] px-2 font-mono text-[11px]"
            >
              {LAW_COUNTS.map((value) => (
                <option key={value} value={value}>
                  {value} 部
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="hud-label">每部抽取</span>
            <select
              value={perLaw}
              onChange={(event) =>
                setPerLaw(Number(event.target.value))
              }
              className="h-10 w-full border-2 border-[var(--line)] bg-[var(--card)] px-2 font-mono text-[11px]"
            >
              {ARTICLE_COUNTS.map((value) => (
                <option key={value} value={value}>
                  {value} 条
                </option>
              ))}
            </select>
          </label>

          <Button disabled={loading || eligibleLaws.length === 0} onClick={draw}>
            {loading ? '抽取中…' : '随机抽取'}
          </Button>
        </div>

        <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <input
            type="checkbox"
            checked={onlyUnlearned}
            onChange={(event) => setOnlyUnlearned(event.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          仅抽未学法条
        </label>

        <p className="font-mono text-[10px] text-[var(--muted)]">
          符合条件的法律：{eligibleLaws.length} 部
          {effectiveLawCount < lawCount &&
            ` · 本次最多 ${effectiveLawCount} 部`}
        </p>
        {eligibleLaws.length === 0 && (
          <p className="text-xs leading-6 text-[var(--danger)]">
            所有法律都已学过。关闭“仅抽未学”可复读，或到“到期加深”。
          </p>
        )}
        {note && (
          <p aria-live="polite" className="text-xs leading-6 text-[var(--muted)]">
            {note}
          </p>
        )}
      </section>

      {groups.length === 0 ? (
        <div className="border-2 border-dashed border-[var(--line)] p-6 text-sm text-[var(--muted)]">
          设定范围后抽取。每次抽取会重新随机选择法律和条文。
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="hud-label">
              本次抽取 · {totalPicked} 条
            </p>
            <p className="font-mono text-[10px] text-[var(--muted)]">
              每条可独立标记，重复标记会加深阶段
            </p>
          </div>

          {groups.map((group) => {
            const law = getLaw(group.lawId);
            if (!law) {
              return null;
            }
            return (
              <section
                key={group.lawId}
                className="hud-panel space-y-4 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[var(--line)] pb-2">
                  <Link
                    to={`/law/${law.id}`}
                    className="text-lg font-black hover:text-[var(--accent)]"
                  >
                    {law.title}
                  </Link>
                  <Badge tone="muted">{group.articles.length} 条</Badge>
                </div>
                <div className="space-y-5">
                  {group.articles.map((article) => (
                    <ArticleStudyRow
                      key={article.articleNo}
                      articleNo={article.articleNo}
                      text={article.text}
                      progress={progressById.get(
                        progressKey(law.id, article.articleNo),
                      )}
                      onMark={() => onMark(law.id, article.articleNo)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

type WholeProps = {
  laws: ReturnType<typeof getLaws>;
  lawById: Map<string, ReturnType<typeof getLaw>>;
  progressById: Map<string, LawProgress>;
  initialLawId: string;
  onMark: (lawId: string, articleNo: string) => Promise<void>;
};

function WholeLawStudy({
  laws,
  lawById,
  progressById,
  initialLawId,
  onMark,
}: WholeProps) {
  const [lawId, setLawId] = useState(initialLawId);
  const [onlyUnlearned, setOnlyUnlearned] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const [notice, setNotice] = useState('');
  const [loaded, setLoaded] = useState<{
    lawId: string;
    articles: LawArticle[];
    error: string;
  } | null>(null);
  const law = lawById.get(lawId) ?? undefined;
  const articles =
    loaded?.lawId === lawId ? loaded.articles : [];
  const loading = Boolean(lawId) && loaded?.lawId !== lawId;

  useEffect(() => {
    if (!lawId) {
      return;
    }
    let active = true;

    loadArticles(lawId)
      .then((next) => {
        if (active) {
          setLoaded({ lawId, articles: next, error: '' });
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setLoaded({
            lawId,
            articles: [],
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
  }, [lawId]);

  const learnedCount = articles.filter((article) =>
    progressById.has(progressKey(lawId, article.articleNo)),
  ).length;
  const visibleArticles = onlyUnlearned
    ? articles.filter(
        (article) =>
          !progressById.has(progressKey(lawId, article.articleNo)),
      )
    : articles;
  const unlearned = articles.filter(
    (article) =>
      !progressById.has(progressKey(lawId, article.articleNo)),
  );

  const markAll = async () => {
    const count = await markLawArticlesLearned(
      lawId,
      unlearned.map((article) => article.articleNo),
    );
    setConfirmAll(false);
    setNotice(
      count > 0
        ? `已将 ${count} 条未学法条标记为第 1 阶。`
        : '当前没有未学法条。',
    );
  };

  const groups = new Map<string, LawArticle[]>();
  for (const article of visibleArticles) {
    const key = article.path.join(' / ') || '正文';
    const group = groups.get(key);
    if (group) {
      group.push(article);
    } else {
      groups.set(key, [article]);
    }
  }

  return (
    <div className="space-y-5">
      <section className="hud-panel space-y-4 p-4">
        <label className="block space-y-1">
          <span className="hud-label">选择法律</span>
          <select
            value={lawId}
            onChange={(event) => setLawId(event.target.value)}
            className="h-10 w-full border-2 border-[var(--line)] bg-[var(--card)] px-2 font-mono text-[11px]"
          >
            <option value="">— 选择一部法律 —</option>
            {laws.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}（{item.articleCount} 条）
              </option>
            ))}
          </select>
        </label>

        {law && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold">{law.title}</p>
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
              label={`${law.title}学习进度`}
            />
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <input
                  type="checkbox"
                  checked={onlyUnlearned}
                  onChange={(event) =>
                    setOnlyUnlearned(event.target.checked)
                  }
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                只看未学
              </label>
              {unlearned.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmAll(true)}
                >
                  标记全部未学（{unlearned.length}）
                </Button>
              )}
            </div>
            {confirmAll && (
              <div className="border-2 border-[var(--line)] bg-[var(--accent-soft)] p-3">
                <p className="text-sm font-bold">
                  将 {unlearned.length} 条未学法条标记为第 1 阶？
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  已学过的法条不会被改动。
                </p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => void markAll()}>
                    确认
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmAll(false)}
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}
            {notice && (
              <p aria-live="polite" className="text-xs text-[var(--accent)]">
                {notice}
              </p>
            )}
          </div>
        )}
      </section>

      {!lawId && (
        <p className="border-2 border-dashed border-[var(--line)] p-6 text-sm text-[var(--muted)]">
          选择一部法律后，将按章展开全部条文。
        </p>
      )}
      {loading && (
        <p className="text-sm text-[var(--muted)]" aria-busy="true">
          正在加载全文…
        </p>
      )}
      {loaded?.lawId === lawId && loaded.error && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {loaded.error}
        </p>
      )}
      {!loading && lawId && articles.length === 0 && (
        <p className="text-sm text-[var(--muted)]">暂无可学习条文。</p>
      )}
      {!loading &&
        lawId &&
        articles.length > 0 &&
        visibleArticles.length === 0 && (
          <p className="text-sm text-[var(--muted)]">
            这部法律已全部学过。可关闭“只看未学”复读，或到“到期加深”。
          </p>
        )}

      {[...groups.entries()].map(([path, items]) => (
        <section key={path} className="space-y-4">
          <h3 className="flex items-center gap-2 border-b-2 border-[var(--line)] pb-1 text-sm font-black">
            <span
              className="h-2.5 w-1 bg-[var(--accent)]"
              aria-hidden="true"
            />
            {path}
          </h3>
          <div className="space-y-5">
            {items.map((article) => (
              <ArticleStudyRow
                key={article.articleNo}
                articleNo={article.articleNo}
                text={article.text}
                progress={progressById.get(
                  progressKey(lawId, article.articleNo),
                )}
                onMark={() => onMark(lawId, article.articleNo)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

type DueProps = {
  lawProgress: LawProgress[];
  lawById: Map<string, ReturnType<typeof getLaw>>;
  progressById: Map<string, LawProgress>;
  onMark: (lawId: string, articleNo: string) => Promise<void>;
};

function DueStudy({
  lawProgress,
  lawById,
  progressById,
  onMark,
}: DueProps) {
  const [lawCache, setLawCache] = useState<
    Map<string, LawArticle[]>
  >(new Map());
  const due = lawProgress
    .filter((record) => isDue(record))
    .sort((a, b) => a.nextDueAt.localeCompare(b.nextDueAt))
    .slice(0, DUE_LIMIT);
  const dueLawIds = [...new Set(due.map((record) => record.lawId))];
  const dueLawKey = dueLawIds.join('|');

  useEffect(() => {
    const missing = dueLawIds.filter((id) => !lawCache.has(id));
    if (missing.length === 0) {
      return;
    }
    let active = true;

    Promise.all(
      missing.map(async (id) => ({
        id,
        articles: await loadArticles(id),
      })),
    ).then((loaded) => {
      if (!active) {
        return;
      }
      setLawCache((current) => {
        const next = new Map(current);
        for (const item of loaded) {
          next.set(item.id, item.articles);
        }
        return next;
      });
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dueLawKey]);

  const grouped = new Map<string, LawProgress[]>();
  for (const record of due) {
    const group = grouped.get(record.lawId);
    if (group) {
      group.push(record);
    } else {
      grouped.set(record.lawId, [record]);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="hud-label">到期加深 · {due.length} 条</p>
        {lawProgress.filter((record) => isDue(record)).length >
          DUE_LIMIT && (
          <p className="font-mono text-[10px] text-[var(--muted)]">
            今日到期较多，先显示前 {DUE_LIMIT} 条。
          </p>
        )}
      </div>

      {due.length === 0 && (
        <div className="border-2 border-dashed border-[var(--line)] p-6 text-sm text-[var(--muted)]">
          暂无到期法条。新标记的法条会按阶段回到这里。
        </div>
      )}

      {[...grouped.entries()].map(([lawId, records]) => {
        const law = lawById.get(lawId);
        const articles = lawCache.get(lawId) ?? [];
        return (
          <section key={lawId} className="hud-panel space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[var(--line)] pb-2">
              <Link
                to={`/law/${lawId}`}
                className="text-lg font-black hover:text-[var(--accent)]"
              >
                {law?.title ?? lawId}
              </Link>
              <Badge tone="muted">{records.length} 条到期</Badge>
            </div>
            {articles.length === 0 && (
              <p className="text-xs text-[var(--muted)]">正在加载条文…</p>
            )}
            <div className="space-y-5">
              {records.map((record) => {
                const article = articles.find(
                  (item) => item.articleNo === record.articleNo,
                );
                if (!article) {
                  return null;
                }
                return (
                  <ArticleStudyRow
                    key={record.articleNo}
                    articleNo={article.articleNo}
                    text={article.text}
                    progress={progressById.get(record.id) ?? record}
                    onMark={() => onMark(lawId, article.articleNo)}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="flex flex-wrap gap-2">
        <ButtonLink to="/laws" variant="outline" size="sm">
          去法律库
        </ButtonLink>
        <ButtonLink to="/study?mode=random" variant="ghost" size="sm">
          随机抽条
        </ButtonLink>
      </div>
    </div>
  );
}
