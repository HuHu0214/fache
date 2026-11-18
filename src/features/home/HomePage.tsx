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
            className="rounded-full border border-[var(--line)] px-2.5 py-0.5 text-[var(--muted)] underline-offset-4 hover:underline"
          >
            搜索法条和概念
          </Link>
        </div>
      </section>

      {!hasData && (
        <p className="rounded-xl border border-dashed border-[var(--line)] px-4 py-5 text-sm text-[var(--muted)]">
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
              <Card className="h-full transition-shadow hover:shadow-md">
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
                    <div className="flex justify-between text-xs text-[var(--muted)]">
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
