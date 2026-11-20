import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { getScenarios, getThemes } from '../../content/registry';
import { cn } from '../../lib/cn';
import { playClick } from '../../lib/sound';
import { buildReviewQueue } from '../review/queue';
import { DailyChest } from '../rewards/DailyChest';
import { computeProfile } from '../settings/profile';
import { useProfileData } from '../settings/useProfileData';
import { buildThemePath, type PathStatus } from './path';

const ROW_HEIGHT = 104;
const OFFSETS = [0, 14, 0, -14, 0, 14];

type PathNodeData = {
  id: string;
  index: number;
  status: PathStatus;
  title: string;
  to: string;
};

function PathNode({
  node,
  offset,
  top,
}: {
  node: PathNodeData;
  offset: number;
  top: number;
}) {
  const base =
    'relative grid h-[72px] w-[72px] place-items-center rounded-full border-2 font-mono text-sm transition-transform';

  return (
    <div
      className="absolute flex w-40 -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{
        left: `calc(50% + ${offset}%)`,
        top: `${top}px`,
      }}
    >
      {node.status === 'locked' && (
        <span
          aria-disabled="true"
          aria-label={`${node.title}（未解锁）`}
          title={`${node.title}（未解锁）`}
          className={cn(
            base,
            'border-[var(--line)] bg-[var(--bg-elev)] text-[var(--muted)] opacity-55',
          )}
        >
          {String(node.index + 1).padStart(2, '0')}
        </span>
      )}

      {node.status === 'complete' && (
        <Link
          to={node.to}
          aria-label={node.title}
          title={node.title}
          onClick={playClick}
          className={cn(
            base,
            'path-node-complete border-[var(--accent)] bg-[var(--accent-soft)] text-xl font-bold text-[var(--accent)] shadow-[0_0_16px_-8px_var(--accent)] hover:scale-105 hover:shadow-[0_0_26px_-6px_var(--accent)]',
          )}
        >
          ✓
        </Link>
      )}

      {node.status === 'current' && (
        <Link
          to={node.to}
          aria-label={node.title}
          title={node.title}
          onClick={playClick}
          className={cn(
            base,
            'path-node-current border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)] hover:scale-105',
          )}
        >
          {String(node.index + 1).padStart(2, '0')}
          <span
            className="path-arrow absolute -top-7 text-[var(--accent)]"
            aria-hidden="true"
          >
            ▼
          </span>
        </Link>
      )}

      {node.status === 'current' && (
        <p className="mt-2 max-w-[12rem] text-center text-xs leading-5 text-[var(--ink)]">
          {node.title}
        </p>
      )}
    </div>
  );
}

function UnitPath({
  nodes,
  completed,
}: {
  nodes: PathNodeData[];
  completed: number;
}) {
  const height = nodes.length * ROW_HEIGHT;

  return (
    <div className="relative mx-auto w-full max-w-[27rem]" style={{ height }}>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {nodes.map((node, index) => {
          if (index === 0) {
            return null;
          }
          const previous = nodes[index - 1];
          return (
            <line
              key={node.id}
              x1={50 + OFFSETS[index - 1]}
              y1={(index - 1) * ROW_HEIGHT + ROW_HEIGHT / 2}
              x2={50 + OFFSETS[index]}
              y2={index * ROW_HEIGHT + ROW_HEIGHT / 2}
              stroke={
                previous.status === 'complete'
                  ? 'var(--accent)'
                  : 'var(--line-strong)'
              }
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {nodes.map((node, index) => (
        <PathNode
          key={node.id}
          node={node}
          offset={OFFSETS[index]}
          top={index * ROW_HEIGHT + ROW_HEIGHT / 2}
        />
      ))}

      {completed === nodes.length && (
        <p className="absolute inset-x-0 bottom-0 text-center font-mono text-[10px] tracking-[0.25em] text-[var(--accent)]">
          [ UNIT CLEARED ]
        </p>
      )}
    </div>
  );
}

export default function HomePage() {
  const { reads, progress, stats } = useProfileData();
  const profile = computeProfile(stats);
  const dueCount = buildReviewQueue(progress, new Date()).length;

  const units = getThemes().map((theme) => {
    const scenarios = getScenarios(theme.id);
    return {
      theme,
      scenarios,
      nodes: scenarios.map((scenario) => ({
        id: scenario.meta.id,
        title: scenario.meta.title,
        to: `/scenario/${scenario.meta.id}`,
      })),
    };
  });

  const flatNodes = units.flatMap((unit) => unit.nodes);
  const path = buildThemePath(
    flatNodes.map((node) => node.id),
    reads,
  );
  const nodes: PathNodeData[] = flatNodes.map((node, index) => ({
    ...node,
    index,
    status: path[index]?.status ?? 'locked',
  }));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const completedCount = nodes.filter(
    (node) => node.status === 'complete',
  ).length;
  const currentNode = nodes.find(
    (node) => node.status === 'current',
  );
  const continueTo = currentNode ? currentNode.to : '/review';

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
            <p className="hud-label">[ LEARNING PATH ] 法径航线</p>
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
              已通关 {completedCount}/18
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

      <DailyChest />

      <div className="mx-auto max-w-[30rem]">
        {units.map((unit) => {
          const unitNodes = unit.nodes.map(
            (node) => nodeById.get(node.id)!,
          );
          const completed = unitNodes.filter(
            (node) => node.status === 'complete',
          ).length;

          return (
            <section key={unit.theme.id} className="pb-8">
              <div className="mt-4 flex items-end justify-between gap-3 border-b border-[var(--line)] pb-2">
                <Link
                  to={`/theme/${unit.theme.id}`}
                  className="focus-visible:outline-none"
                >
                  <h3 className="text-xl font-semibold">
                    {unit.theme.title}
                  </h3>
                </Link>
                <span className="font-mono text-[10px] tracking-[0.12em] text-[var(--amber)]">
                  {completed}/{unitNodes.length}
                </span>
              </div>
              <Progress
                value={(completed / unitNodes.length) * 100}
                className="mt-2 mb-4"
                label={`${unit.theme.title}通关进度`}
              />
              <UnitPath nodes={unitNodes} completed={completed} />
            </section>
          );
        })}
      </div>

      <p className="mx-auto max-w-[30rem] text-xs leading-6 text-[var(--muted)]">
        一条 18 节点的主航线，必须按顺序通关：展开答案并完成自评后，下一个节点才会解锁。点主题名可以进入章节页自由浏览。
      </p>
    </div>
  );
}
