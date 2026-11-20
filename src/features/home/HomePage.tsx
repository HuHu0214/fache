import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { getScenarios, getThemes } from '../../content/registry';
import { cn } from '../../lib/cn';
import { playClick } from '../../lib/sound';
import { buildReviewQueue } from '../review/queue';
import { DailyChest } from '../rewards/DailyChest';
import { StreakPanel } from '../rewards/StreakPanel';
import { computeProfile } from '../settings/profile';
import { useProfileData } from '../settings/useProfileData';
import {
  buildGlobalPath,
  type PathStatus,
} from './path';

const ROW_HEIGHT = 104;
const offsetFor = (index: number) =>
  [0, 14, 0, -14][index % 4];

type PathNodeData = {
  id: string;
  index: number;
  kind: 'scenario' | 'boss';
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
  const isBoss = node.kind === 'boss';

  const tone = {
    locked: isBoss
      ? 'border-[var(--amber)]/30 bg-[var(--bg-elev)] text-[var(--amber)]/50 opacity-60'
      : 'border-[var(--line)] bg-[var(--bg-elev)] text-[var(--muted)] opacity-55',
    complete: isBoss
      ? 'path-node-complete border-[var(--amber)] bg-[var(--amber-soft)] text-lg font-bold text-[var(--amber)] shadow-[0_0_16px_-8px_var(--amber)] hover:scale-105'
      : 'path-node-complete border-[var(--accent)] bg-[var(--accent-soft)] text-xl font-bold text-[var(--accent)] shadow-[0_0_16px_-8px_var(--accent)] hover:scale-105',
    current: isBoss
      ? 'path-node-current border-[var(--amber)] bg-[var(--amber)] text-[#1a1206] hover:scale-105'
      : 'path-node-current border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)] hover:scale-105',
  } as const;

  const label =
    node.kind === 'boss'
      ? 'BOSS'
      : String(node.index + 1).padStart(2, '0');

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
            tone.locked,
            isBoss && 'text-[10px] tracking-[0.12em]',
          )}
        >
          {label}
        </span>
      )}

      {node.status !== 'locked' && (
        <Link
          to={node.to}
          aria-label={node.title}
          title={node.title}
          onClick={playClick}
          className={cn(
            base,
            tone[node.status === 'complete' ? 'complete' : 'current'],
            isBoss && 'text-[10px] tracking-[0.12em]',
          )}
        >
          {node.status === 'complete' ? '✓' : label}
          {node.status === 'current' && (
            <span
              className={cn(
                'path-arrow absolute -top-7',
                isBoss
                  ? 'text-[var(--amber)]'
                  : 'text-[var(--accent)]',
              )}
              aria-hidden="true"
            >
              ▼
            </span>
          )}
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

function UnitPath({ nodes }: { nodes: PathNodeData[] }) {
  const height = nodes.length * ROW_HEIGHT;

  return (
    <div
      className="relative mx-auto w-full max-w-[27rem]"
      style={{ height }}
    >
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
              x1={50 + offsetFor(index - 1)}
              y1={(index - 1) * ROW_HEIGHT + ROW_HEIGHT / 2}
              x2={50 + offsetFor(index)}
              y2={index * ROW_HEIGHT + ROW_HEIGHT / 2}
              stroke={
                previous.status === 'complete'
                  ? previous.kind === 'boss'
                    ? 'var(--amber)'
                    : 'var(--accent)'
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
          offset={offsetFor(index)}
          top={index * ROW_HEIGHT + ROW_HEIGHT / 2}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const { reads, progress, stats, setting } = useProfileData();
  const profile = computeProfile(stats);
  const dueCount = buildReviewQueue(progress, new Date()).length;

  const themes = getThemes();
  const units = themes.map((theme) => ({
    theme,
    scenarios: getScenarios(theme.id),
  }));
  const scenarioById = new Map(
    units.flatMap((unit) =>
      unit.scenarios.map((scenario) => [scenario.meta.id, scenario]),
    ),
  );

  const globalNodes = buildGlobalPath(
    units.map((unit) => ({
      themeId: unit.theme.id,
      scenarioIds: unit.scenarios.map(
        (scenario) => scenario.meta.id,
      ),
    })),
    reads,
    setting?.bossCleared ?? [],
  );

  const nodes: PathNodeData[] = globalNodes.map((node, index) => {
    const theme = themes.find((item) => item.id === node.themeId);
    if (node.kind === 'boss') {
      return {
        id: node.id,
        index,
        kind: 'boss',
        status: node.status,
        title: `${theme?.title ?? '章节'} · Boss 关`,
        to: `/boss/${node.themeId}`,
      };
    }
    const scenario = scenarioById.get(node.id);
    return {
      id: node.id,
      index,
      kind: 'scenario',
      status: node.status,
      title: scenario?.meta.title ?? node.id,
      to: `/scenario/${node.id}`,
    };
  });

  const completedCount = nodes.filter(
    (node) =>
      node.kind === 'scenario' && node.status === 'complete',
  ).length;
  const bossClearedCount =
    setting?.bossCleared?.length ?? 0;
  const currentNode = nodes.find(
    (node) => node.status === 'current',
  );
  const continueTo = currentNode ? currentNode.to : '/review';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-[3px] border-[var(--line)] bg-[var(--band-bg)] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--band-fg)]">
        <span>公共法律信息 · 学习指引</span>
        <span>
          NO. {new Date().toISOString().slice(0, 10)} / 本地
        </span>
      </div>

      <section className="hud-panel relative overflow-hidden p-5 sm:p-6">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(47,91,255,0.08),transparent)] opacity-70"
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
            <h2 className="mt-1 text-3xl font-black tracking-tight">
              继续研读
            </h2>
            <p className="mt-1 font-mono text-[10px] tracking-[0.08em] text-[var(--muted)]">
              {profile.title} · {profile.xp} 阅历 · 连续{' '}
              {stats.streak} 天
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="muted">待复习 {dueCount}</Badge>
            <Badge tone="accent">
              已通关 {completedCount}/36
            </Badge>
            <Badge tone="muted">
              Boss {bossClearedCount}/3
            </Badge>
            <Link
              to={continueTo}
              className="inline-flex h-10 items-center border-[3px] border-[var(--line)] bg-[var(--accent)] px-4 font-mono text-[11px] font-bold tracking-[0.12em] text-[var(--on-accent)] shadow-[4px_4px_0_var(--shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_var(--shadow)]"
            >
              继续学习 →
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <DailyChest />
        <StreakPanel
          streak={stats.streak}
          reads={reads}
          setting={setting}
        />
      </div>

      <div className="mx-auto max-w-[30rem]">
        {units.map((unit) => {
          const unitNodes = nodes.filter(
            (node) =>
              node.id === `boss:${unit.theme.id}` ||
              unit.scenarios.some(
                (scenario) => scenario.meta.id === node.id,
              ),
          );
          const scenarioCompleted = unitNodes.filter(
            (node) =>
              node.kind === 'scenario' &&
              node.status === 'complete',
          ).length;
          const bossNode = unitNodes.find(
            (node) => node.kind === 'boss',
          );

          return (
            <section
              key={unit.theme.id}
              className="hud-panel mb-8 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-[3px] border-[var(--line)] bg-[var(--band-bg)] px-3 py-2">
                <Link
                  to={`/theme/${unit.theme.id}`}
                  className="focus-visible:outline-none"
                >
                  <h3 className="text-xl font-black text-[var(--band-fg)]">
                    {unit.theme.title}
                  </h3>
                </Link>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--yellow)]">
                  {scenarioCompleted}/{unit.scenarios.length}
                  {bossNode?.status === 'complete' && ' · BOSS ✓'}
                  {bossNode?.status === 'current' && ' · BOSS READY'}
                </span>
              </div>
              <Progress
                value={
                  (scenarioCompleted / unit.scenarios.length) * 100
                }
                className="mt-2 mb-4"
                label={`${unit.theme.title}通关进度`}
              />
              <UnitPath nodes={unitNodes} />
            </section>
          );
        })}
      </div>

      <p className="mx-auto max-w-[30rem] text-xs leading-6 text-[var(--muted)]">
        主线：36 个场景 + 3 个章节 Boss。每章 12 个场景全部通关后解锁
        Boss；通过 Boss 才能进入下一章。点主题名可自由浏览章节内容。
      </p>
    </div>
  );
}
