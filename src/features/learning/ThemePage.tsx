import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import {
  getKnowledgePoints,
  getScenarios,
  getTheme,
} from '../../content/registry';
import { db } from '../../lib/db';
import { computeThemeProgress } from './theme-progress';

export type ThemePageProps = {
  themeId?: string;
};

export default function ThemePage({ themeId }: ThemePageProps) {
  const params = useParams();
  const id = themeId ?? params.themeId ?? '';
  const theme = getTheme(id);
  const reads = useLiveQuery(() => db.reads.toArray(), []) ?? [];
  const progress = useLiveQuery(() => db.progress.toArray(), []) ?? [];

  if (!theme) {
    return (
      <p className="text-sm text-[var(--muted)]">找不到这个主题。</p>
    );
  }

  const scenarios = getScenarios(theme.id);
  const kps = getKnowledgePoints(theme.id);
  const readIds = new Set(reads.map((read) => read.scenarioId));
  const stats = computeThemeProgress({
    scenarioIds: scenarios.map((item) => item.meta.id),
    kpIds: kps.map((item) => item.meta.id),
    readScenarioIds: [...readIds],
    progress,
  });
  const percent =
    stats.scenariosTotal === 0
      ? 0
      : (stats.scenariosRead / stats.scenariosTotal) * 100;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link
          to="/"
          className="font-mono text-[10px] tracking-[0.14em] text-[var(--muted)] hover:text-[var(--accent)]"
        >
          ← 全部主题
        </Link>
        <h2 className="text-3xl font-black tracking-tight">
          {theme.title}
        </h2>
        <p className="text-sm leading-7 text-[var(--muted)]">
          {theme.intro}
        </p>
        <div className="space-y-2">
          <Progress value={percent} label={`${theme.title}阅读进度`} />
          <div className="flex gap-3 font-mono text-[10px] tracking-[0.08em] text-[var(--muted)]">
            <span>
              已读 {stats.scenariosRead}/{stats.scenariosTotal} 个场景
            </span>
            <span>掌握 {stats.kpsMastered}/{stats.kpsTotal} 个知识点</span>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-black">
          <span className="h-3 w-1 bg-[var(--accent)]" aria-hidden="true" />
          场景
        </h3>
        {scenarios.map((scenario, index) => (
          <Link
            key={scenario.meta.id}
            to={`/scenario/${scenario.meta.id}`}
            className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <Card className="transition-colors hover:border-[var(--accent)] hover:shadow-[0_0_24px_-14px_var(--accent)]">
              <CardContent className="flex items-start gap-4">
                <span className="mt-0.5 font-mono text-[10px] tracking-[0.1em] text-[var(--amber)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-base font-black">
                    {scenario.meta.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)]">
                    {scenario.meta.hook}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 text-xs text-[var(--muted)]">
                    <span>{scenario.meta.estimatedMinutes} 分钟</span>
                    {readIds.has(scenario.meta.id) && (
                      <Badge tone="accent">已读</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-black">
          <span className="h-3 w-1 bg-[var(--amber)]" aria-hidden="true" />
          知识点
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {kps.map((kp) => (
            <Link
              key={kp.meta.id}
              to={`/concept/${kp.meta.id}`}
              aria-label={kp.meta.title}
              className="hud-panel px-4 py-3 transition-colors hover:border-[var(--accent)] hover:shadow-[0_0_24px_-14px_var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <span className="block text-sm font-medium">
                {kp.meta.title}
              </span>
              <span className="mt-1 block text-xs leading-6 text-[var(--muted)]">
                {kp.meta.oneLiner}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
