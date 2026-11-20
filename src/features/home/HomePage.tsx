import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import {
  getKnowledgePoints,
  getScenarios,
  getThemes,
} from '../../content/registry';
import { db } from '../../lib/db';
import {
  computeStreak,
  computeThemeProgress,
} from '../learning/theme-progress';

export default function HomePage() {
  const reads = useLiveQuery(() => db.reads.toArray(), []) ?? [];
  const progress = useLiveQuery(() => db.progress.toArray(), []) ?? [];
  const now = new Date();

  const dueCount = progress.filter(
    (item) => item.due !== undefined && new Date(item.due) <= now,
  ).length;
  const streak = computeStreak(reads, now);
  const hasData = reads.length > 0 || progress.length > 0;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="hud-label">[ SYS ] 学习终端</p>
        <h2 className="text-2xl font-semibold tracking-tight">
          今天学点什么
        </h2>
        <p className="text-sm leading-7 text-[var(--muted)]">
          按生活里的问题学法律。不用从头啃法条，遇到感兴趣的，点进去就好。
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge tone="muted">今日待复习 {dueCount}</Badge>
          <Badge tone="muted">连续学习 {streak} 天</Badge>
          <Link
            to="/search"
            className="rounded-[2px] border border-[var(--line)] px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            搜索法条和概念
          </Link>
        </div>
      </section>

      {!hasData && (
        <p className="hud-panel px-4 py-5 text-sm text-[var(--muted)]">
          从第一个场景开始，选一个你最想弄明白的问题。
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        {getThemes().map((theme) => {
          const scenarios = getScenarios(theme.id);
          const kps = getKnowledgePoints(theme.id);
          const stats = computeThemeProgress({
            scenarioIds: scenarios.map((item) => item.meta.id),
            kpIds: kps.map((item) => item.meta.id),
            readScenarioIds: reads.map((read) => read.scenarioId),
            progress,
          });
          const percent =
            stats.scenariosTotal === 0
              ? 0
              : (stats.scenariosRead / stats.scenariosTotal) * 100;

          return (
            <Link
              key={theme.id}
              to={`/theme/${theme.id}`}
              className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <Card className="h-full transition-colors hover:border-[var(--accent)] hover:shadow-[0_0_28px_-14px_var(--accent)]">
                <CardHeader>
                  <CardTitle>{theme.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-6 text-[var(--muted)]">
                    {theme.intro}
                  </p>
                  <div className="space-y-2">
                    <Progress
                      value={percent}
                      label={`${theme.title}阅读进度`}
                    />
                    <div className="flex justify-between font-mono text-[10px] tracking-[0.08em] text-[var(--muted)]">
                      <span>
                        已读 {stats.scenariosRead}/{stats.scenariosTotal}{' '}
                        个场景
                      </span>
                      <span>{stats.kpsTotal} 个知识点</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
