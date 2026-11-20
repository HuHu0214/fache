import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { ButtonLink } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import {
  buildDueCurve,
  buildStageCounts,
  EBBINGHAUS_STAGES,
  formatDue,
  isDue,
  stageInfo,
  summarizeByLaw,
} from '../../lib/ebbinghaus';
import { localDateKey } from '../../lib/date';
import { DailyChest } from '../rewards/DailyChest';
import { StreakPanel } from '../rewards/StreakPanel';
import {
  computeAchievements,
  computeProfile,
} from '../settings/profile';
import { useProfileData } from '../settings/useProfileData';

export default function HomePage() {
  const { lawProgress, setting, stats, studyDays, laws } =
    useProfileData();
  const now = new Date();
  const profile = computeProfile(stats);
  const lawById = new Map(laws.map((law) => [law.id, law]));
  const summaries = [
    ...summarizeByLaw(lawProgress, now).values(),
  ].flatMap((summary) => {
    const law = lawById.get(summary.lawId);
    return law ? [{ ...summary, law }] : [];
  });
  summaries.sort((a, b) =>
    b.lastStudiedAt.localeCompare(a.lastStudiedAt),
  );
  const due = lawProgress
    .filter((record) => isDue(record, now))
    .sort((a, b) => a.nextDueAt.localeCompare(b.nextDueAt));
  const stageCounts = buildStageCounts(lawProgress);
  const curve = buildDueCurve(lawProgress, now, 7);
  const maxCurve = Math.max(1, ...curve.map((bucket) => bucket.count));
  const exported =
    typeof localStorage !== 'undefined' &&
    localStorage.getItem('fajing.exported') === '1';
  const achievements = computeAchievements(stats, { exported });
  const unlocked = achievements.filter((item) => item.unlocked).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-[3px] border-[var(--line)] bg-[var(--band-bg)] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--band-fg)]">
        <span>法条学习 · 艾宾浩斯看板</span>
        <span>
          NO. {localDateKey(now)} / 本地
        </span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
        <aside className="order-2 space-y-4 xl:order-1 xl:sticky xl:top-24 xl:self-start">
          <section className="hud-panel p-4">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <p className="hud-label">[ LAW PROGRESS ]</p>
                <h2 className="mt-1 text-xl font-black">法律进度</h2>
              </div>
              <Badge tone="muted">{summaries.length} 部</Badge>
            </div>

            {summaries.length === 0 ? (
              <div className="mt-4 border-2 border-dashed border-[var(--line)] p-3 text-xs leading-6 text-[var(--muted)]">
                尚无学习记录。进入法律库，从任意一条法条开始。
                <ButtonLink
                  to="/laws"
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                >
                  浏览法律
                </ButtonLink>
              </div>
            ) : (
              <div className="mt-3 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                {summaries.map((summary) => (
                  <Link
                    key={summary.lawId}
                    to={`/law/${summary.lawId}`}
                    className="block border-2 border-[var(--line)] bg-[var(--card)] p-3 transition-colors hover:border-[var(--accent)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 text-sm font-bold leading-5">
                        {summary.law.shortTitle}
                      </p>
                      <span className="shrink-0 font-mono text-[9px] text-[var(--accent)]">
                        {summary.learned}/{summary.law.articleCount}
                      </span>
                    </div>
                    <Progress
                      value={
                        (summary.learned /
                          summary.law.articleCount) *
                        100
                      }
                      className="mt-2"
                      label={`${summary.law.shortTitle}进度`}
                    />
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] text-[var(--muted)]">
                      <span>阶段合计 {summary.stageTotal}</span>
                      {summary.due > 0 && (
                        <span className="text-[var(--danger)]">
                          到期 {summary.due}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <Link
              to="/laws"
              className="mt-3 block border-t-2 border-[var(--line)] pt-3 font-mono text-[10px] tracking-[0.1em] text-[var(--accent)]"
            >
              查看全部法律 →
            </Link>
          </section>
        </aside>

        <div className="order-1 space-y-5 xl:order-2">
          <section className="hud-panel p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-5">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[var(--radius-pill)] border-2 border-[var(--line)] bg-[var(--accent-soft)] text-center">
                <div>
                  <p className="font-mono text-[9px] tracking-[0.16em] text-[var(--muted)]">
                    LV
                  </p>
                  <p className="font-mono text-xl font-bold text-[var(--accent)]">
                    {profile.level}
                  </p>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="hud-label">[ OVERVIEW ]</p>
                <h2 className="mt-1 text-3xl font-black tracking-tight">
                  学习总览
                </h2>
                <p className="mt-1 font-mono text-[10px] tracking-[0.08em] text-[var(--muted)]">
                  {profile.title} · {profile.xp} 阅历 · 连续 {stats.streak}{' '}
                  天
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="accent">
                  已学 {stats.articlesLearned} 条
                </Badge>
                <Badge tone="muted">
                  开始 {stats.lawsStarted} 部
                </Badge>
                <Badge tone="muted">
                  学完 {stats.lawsCompleted} 部
                </Badge>
                <Badge tone="muted">到期 {due.length}</Badge>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink to="/study?mode=random">随机抽条</ButtonLink>
              <ButtonLink
                to="/study?mode=whole"
                variant="outline"
              >
                整部法律
              </ButtonLink>
              <ButtonLink
                to="/study?mode=due"
                variant="ghost"
              >
                到期加深{due.length > 0 ? `（${due.length}）` : ''}
              </ButtonLink>
            </div>
          </section>

          <section className="hud-panel p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="hud-label">[ CURVE ]</p>
                <h3 className="mt-1 text-xl font-black">
                  学习曲线
                </h3>
              </div>
              <p className="font-mono text-[10px] text-[var(--muted)]">
                未来 7 天到期 · 共{' '}
                {curve.reduce((sum, bucket) => sum + bucket.count, 0)} 条
              </p>
            </div>

            <div className="mt-4 flex h-36 items-end gap-2 border-b-2 border-[var(--line)] pb-1">
              {curve.map((bucket, index) => (
                <div
                  key={bucket.dateKey}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                >
                  <span className="font-mono text-[9px] text-[var(--muted)]">
                    {bucket.count > 0 ? bucket.count : ''}
                  </span>
                  <div
                    className={
                      index === 0
                        ? 'w-full max-w-8 bg-[var(--pink)]'
                        : 'w-full max-w-8 bg-[var(--accent)]'
                    }
                    style={{
                      height:
                        bucket.count === 0
                          ? '2px'
                          : `${Math.max(
                              8,
                              (bucket.count / maxCurve) * 100,
                            )}%`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-2">
              {curve.map((bucket) => (
                <span
                  key={bucket.dateKey}
                  className="text-center font-mono text-[9px] text-[var(--muted)]"
                >
                  {bucket.label}
                </span>
              ))}
            </div>
            <p className="mt-2 font-mono text-[9px] leading-5 text-[var(--muted)]">
              初始 1 天复习，之后 2 / 4 / 7 / 15 / 30 / 60 天逐步拉开。
            </p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <DailyChest />
            <StreakPanel
              streak={stats.streak}
              studyDays={studyDays}
              setting={setting}
            />
          </div>

          <section className="hud-panel p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="hud-label">[ ACHIEVEMENTS ]</p>
                <h3 className="mt-1 text-xl font-black">成就</h3>
              </div>
              <Badge tone="muted">
                {unlocked}/{achievements.length} 已解锁
              </Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {achievements.map((item) => (
                <div
                  key={item.id}
                  className="border-2 border-[var(--line)] bg-[var(--card)] p-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`seal-sm ${
                        item.unlocked ? 'seal-unlocked' : 'seal-locked'
                      }`}
                      aria-hidden="true"
                    >
                      {item.mark}
                    </span>
                    <p className="text-xs font-bold">{item.title}</p>
                  </div>
                  <p className="mt-1.5 text-[10px] leading-5 text-[var(--muted)]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="order-3 space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="hud-panel p-4">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <p className="hud-label">[ DUE ]</p>
                <h2 className="mt-1 text-xl font-black">今日加深</h2>
              </div>
              <Badge tone="muted">{due.length}</Badge>
            </div>

            {due.length === 0 ? (
              <p className="mt-4 border-2 border-dashed border-[var(--line)] p-3 text-xs leading-6 text-[var(--muted)]">
                暂无到期法条。新标记的法条会按阶段回到这里。
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {due.slice(0, 12).map((record) => {
                  const law = lawById.get(record.lawId);
                  return (
                    <li key={record.id}>
                      <Link
                        to={`/law/${record.lawId}/${encodeURIComponent(
                          record.articleNo,
                        )}`}
                        className="block border-2 border-[var(--line)] bg-[var(--card)] p-2.5 transition-colors hover:border-[var(--accent)]"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-xs font-bold">
                            {law?.shortTitle ?? record.lawId}{' '}
                            {record.articleNo}
                          </p>
                          <span className="font-mono text-[9px] text-[var(--danger)]">
                            第{record.stage}阶
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-[9px] text-[var(--muted)]">
                          {stageInfo(record.stage).label} ·{' '}
                          {formatDue(record, now)}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            <ButtonLink
              to="/study?mode=due"
              variant="outline"
              size="sm"
              className="mt-3 w-full"
            >
              进入到期学习
            </ButtonLink>
          </section>

          <section className="hud-panel p-4">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <p className="hud-label">[ STAGES ]</p>
                <h2 className="mt-1 text-xl font-black">阶段看板</h2>
              </div>
              <Badge tone="muted">
                {lawProgress.length} 条
              </Badge>
            </div>

            <ul className="mt-3 space-y-2">
              {EBBINGHAUS_STAGES.map((stage, index) => {
                const count = stageCounts[index] ?? 0;
                const max = Math.max(1, ...stageCounts);
                return (
                  <li key={stage.stage}>
                    <div className="flex items-center justify-between gap-2 font-mono text-[9px]">
                      <span>
                        第{stage.stage}阶 · {stage.label}
                      </span>
                      <span className="text-[var(--muted)]">
                        {count}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 border border-[var(--line)] bg-[var(--card)]">
                      <div
                        className="h-full bg-[var(--accent)]"
                        style={{
                          width: `${(count / max) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 font-mono text-[9px] leading-5 text-[var(--muted)]">
              最高阶间隔：{stageInfo(7).intervalDays} 天。每次重学只推进一阶。
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
