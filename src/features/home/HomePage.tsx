import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import {
  getScenarios,
  getThemes,
} from '../../content/registry';
import { db } from '../../lib/db';
import { cn } from '../../lib/cn';
import { buildReviewQueue } from '../review/queue';
import { computeProfile } from '../settings/profile';
import {
  computeStreak,
} from '../learning/theme-progress';
import {
  buildThemePath,
  type PathStatus,
} from './path';

function PathNode({
  index,
  status,
  title,
  to,
}: {
  index: number;
  status: PathStatus;
  title: string;
  to: string;
}) {
  const base =
    'relative grid h-16 w-16 place-items-center rounded-full border-2 font-mono text-sm transition-transform';

  if (status === 'locked') {
    return (
      <span
        aria-disabled="true"
        aria-label={`${title}（未解锁）`}
        title={`${title}（未解锁）`}
        className={cn(
          base,
          'border-[var(--line)] bg-[var(--bg-elev)] text-[var(--muted)] opacity-55',
        )}
      >
        {String(index + 1).padStart(2, '0')}
      </span>
    );
  }

  if (status === 'complete') {
    return (
      <Link
        to={to}
        aria-label={title}
        title={title}
        className={cn(
          base,
          'path-node-complete border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] hover:scale-105 hover:shadow-[0_0_26px_-6px_var(--accent)]',
        )}
      >
        ✓
      </Link>
    );
  }

  return (
    <Link
      to={to}
      aria-label={title}
      title={title}
      className={cn(
        base,
        'path-node-current border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)] hover:scale-105',
      )}
    >
      {String(index + 1).padStart(2, '0')}
      <span
        className="path-arrow absolute -top-7 text-[var(--accent)]"
        aria-hidden="true"
      >
        ▼
      </span>
    </Link>
  );
}

export default function HomePage() {
  const reads = useLiveQuery(() => db.reads.toArray(), []) ?? [];
  const progress =
    useLiveQuery(() => db.progress.toArray(), []) ?? [];
  const notes = useLiveQuery(() => db.notes.toArray(), []) ?? [];
  const bookmarks =
    useLiveQuery(() => db.bookmarks.toArray(), []) ?? [];

  const stats = {
    scenariosRead: reads.filter((read) => read.rated).length,
    kpsMastered: progress.filter((item) => item.state === 'review')
      .length,
    notes: notes.length,
    bookmarks: bookmarks.length,
    streak: computeStreak(reads, new Date()),
  };
  const profile = computeProfile(stats);
  const dueCount = buildReviewQueue(progress, new Date()).length;

  const lanes = getThemes().map((theme) => {
    const scenarios = getScenarios(theme.id);
    const path = buildThemePath(
      scenarios.map((scenario) => scenario.meta.id),
      reads,
    );
    const completed = path.filter(
      (node) => node.status === 'complete',
    ).length;
    return {
      theme,
      scenarios,
      path,
      completed,
      currentIndex: path.findIndex(
        (node) => node.status === 'current',
      ),
    };
  });

  const activeLane = lanes.find((lane) => lane.currentIndex >= 0);
  const continueTo = activeLane
    ? `/scenario/${activeLane.scenarios[activeLane.currentIndex].meta.id}`
    : '/review';

  return (
    <div className="space-y-8">
      <section className="hud-panel relative overflow-hidden p-5 sm:p-6">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,229,255,0.05),transparent)] opacity-70"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-[var(--accent)]/50 bg-[var(--accent-soft)] text-center">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-[var(--muted)]">
                LV
              </p>
              <p className="font-mono text-xl font-semibold text-[var(--accent)]">
                {profile.level}
              </p>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="hud-label">[ LEARNING PATH ] 学习航线</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              {profile.title}
            </h2>
            <p className="mt-1 font-mono text-[10px] tracking-[0.08em] text-[var(--muted)]">
              {profile.xp} 阅历 · 连续 {stats.streak} 天
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="muted">待复习 {dueCount}</Badge>
            <Badge tone="accent">
              已通关 {stats.scenariosRead}/18
            </Badge>
            <Link
              to={continueTo}
              className="inline-flex h-10 items-center rounded-[2px] border border-[var(--accent)] bg-[var(--accent)] px-4 font-mono text-[11px] tracking-[0.12em] text-[var(--on-accent)] shadow-[0_0_22px_-8px_var(--accent)] hover:brightness-110"
            >
              继续学习 →
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {lanes.map((lane) => {
          const percent =
            lane.scenarios.length === 0
              ? 0
              : (lane.completed / lane.scenarios.length) * 100;

          return (
            <div
              key={lane.theme.id}
              className="hud-panel path-lane relative overflow-hidden p-4"
            >
              <span className="path-sweep" aria-hidden="true" />
              <div className="flex items-start justify-between gap-3">
                <Link
                  to={`/theme/${lane.theme.id}`}
                  className="focus-visible:outline-none"
                >
                  <h3 className="text-lg font-semibold">
                    {lane.theme.title}
                  </h3>
                </Link>
                <span className="font-mono text-[10px] tracking-[0.1em] text-[var(--amber)]">
                  {lane.completed}/{lane.scenarios.length}
                </span>
              </div>
              <Progress
                value={percent}
                className="mt-3"
                label={`${lane.theme.title}通关进度`}
              />

              <div className="relative mt-6 flex flex-col items-center">
                {lane.path.map((node, index) => {
                  const scenario = lane.scenarios[index];
                  return (
                    <div
                      key={node.id}
                      className="flex w-full flex-col items-center"
                    >
                      {index > 0 && (
                        <span
                          className={cn(
                            'h-7 w-px',
                            lane.path[index - 1]?.status === 'complete'
                              ? 'bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]'
                              : 'bg-[var(--line-strong)]',
                          )}
                          aria-hidden="true"
                        />
                      )}
                      <PathNode
                        index={index}
                        status={node.status}
                        title={scenario.meta.title}
                        to={`/scenario/${scenario.meta.id}`}
                      />
                      {node.status === 'current' && (
                        <p className="mt-2 max-w-[13rem] text-center text-xs leading-5 text-[var(--ink)]">
                          {scenario.meta.title}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {lane.completed === lane.scenarios.length && (
                <p className="mt-6 text-center font-mono text-[10px] tracking-[0.2em] text-[var(--accent)]">
                  [ UNIT CLEARED ]
                </p>
              )}
            </div>
          );
        })}
      </section>

      <p className="text-xs leading-6 text-[var(--muted)]">
        每个主题是一条独立航线：完成当前节点并自评后，下一个节点解锁。也可以点主题名进入章节页，查看全部场景和知识点。
      </p>
    </div>
  );
}
