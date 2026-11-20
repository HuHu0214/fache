import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArticleRef } from '../../components/mdx/article-ref';
import { ParticleBurst } from '../../components/ParticleBurst';
import { Badge } from '../../components/ui/badge';
import { Button, ButtonLink } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { getBoss, getScenarios } from '../../content/registry';
import { db } from '../../lib/db';
import { cn } from '../../lib/cn';
import { playClick, playComplete } from '../../lib/sound';
import { clearBoss } from './boss-repo';
import { gradeBoss, type BossResult } from './grade';

export type BossPageProps = {
  themeId?: string;
};

export default function BossPage({ themeId }: BossPageProps) {
  const params = useParams();
  const id = themeId ?? params.themeId ?? '';
  const boss = getBoss(id);
  const scenarios = getScenarios(id);
  const reads = useLiveQuery(() => db.reads.toArray(), []) ?? [];
  const setting = useLiveQuery(() => db.settings.get('app'), []);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<number | undefined>>(
    [],
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<BossResult | null>(null);
  const [firstClear, setFirstClear] = useState(false);
  const [burst, setBurst] = useState(false);

  if (!boss) {
    return (
      <p className="text-sm text-[var(--muted)]">
        这个章节的 Boss 题库尚未收录。
      </p>
    );
  }

  const ratedIds = new Set(
    reads.filter((read) => read.rated).map((read) => read.scenarioId),
  );
  const alreadyCleared =
    setting?.bossCleared?.includes(id) ?? false;
  const unlocked =
    alreadyCleared ||
    scenarios.every((scenario) => ratedIds.has(scenario.meta.id));

  if (!unlocked) {
    return (
      <div className="hud-panel space-y-4 px-6 py-8 text-center">
        <p className="hud-label">[ BOSS LOCKED ]</p>
        <h2 className="text-3xl font-black">{boss.title}</h2>
        <p className="text-sm text-[var(--muted)]">
          完成本章 {scenarios.length} 个场景并自评后解锁。
        </p>
        <Link
          to="/"
          className="inline-block font-mono text-[11px] tracking-[0.12em] text-[var(--accent)]"
        >
          ← 返回航线
        </Link>
      </div>
    );
  }

  const question = boss.questions[index];
  const isLast = index === boss.questions.length - 1;

  const choose = (option: number) => {
    if (revealed) {
      return;
    }
    setSelected(option);
    setRevealed(true);
    setAnswers((previous) => {
      const next = [...previous];
      next[index] = option;
      return next;
    });
    playClick();
  };

  const submit = () => {
    void (async () => {
      const graded = gradeBoss(
        boss.questions,
        answers,
        boss.passScore,
      );
      setResult(graded);
      if (graded.passed) {
        const first = await clearBoss(id);
        setFirstClear(first);
        setBurst(true);
        playComplete();
        setTimeout(() => setBurst(false), 1200);
      }
    })();
  };

  const next = () => {
    if (isLast) {
      submit();
      return;
    }
    setIndex(index + 1);
    setSelected(null);
    setRevealed(false);
  };

  const retry = () => {
    setIndex(0);
    setAnswers([]);
    setSelected(null);
    setRevealed(false);
    setResult(null);
    setFirstClear(false);
  };

  if (result) {
    return (
      <div className="relative">
        {burst && <ParticleBurst count={40} />}
        <div className="hud-panel space-y-4 px-6 py-8 text-center">
          <p className="hud-label">
            [ BOSS RESULT ] {boss.title}
          </p>
          <p className="font-mono text-5xl font-semibold text-[var(--accent)]">
            {result.score}/{result.total}
          </p>
          <p className="text-lg">
            {result.passed
              ? '章节已清算，下一章解锁。'
              : `未通过：需要答对 ${boss.passScore} 题。`}
          </p>
          {result.passed && firstClear && (
            <p className="font-mono text-sm text-[var(--attention-ink)]">
              +100 阅历 · +1 Boss 通关
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            <ButtonLink to="/">返回航线</ButtonLink>
            <Button variant="outline" onClick={retry}>
              重新挑战
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <Link
          to="/"
          className="font-mono text-[10px] tracking-[0.14em] text-[var(--muted)] hover:text-[var(--accent)]"
        >
          ← 返回航线
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="hud-label">[ BOSS ENCOUNTER ]</p>
            <h2 className="mt-1 text-3xl font-black tracking-tight">
              {boss.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {alreadyCleared && <Badge tone="accent">已通关</Badge>}
            <span className="font-mono text-[10px] tracking-[0.12em] text-[var(--muted)]">
              {index + 1}/{boss.questions.length} · 通过需{' '}
              {boss.passScore} 题
            </span>
          </div>
        </div>
        <Progress
          value={(index / boss.questions.length) * 100}
          label="Boss 进度"
        />
      </header>

      <section className="hud-panel space-y-4 px-5 py-5">
        <p className="text-lg leading-8">{question.question}</p>

        <div className="grid gap-2">
          {question.options.map((option, optionIndex) => {
            const isCorrect = optionIndex === question.answer;
            const isSelected = optionIndex === selected;
            return (
              <button
                key={option}
                type="button"
                disabled={revealed}
                onClick={() => choose(optionIndex)}
                className={cn(
                  'flex items-start gap-3 border-2 border-[var(--line)] px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)] disabled:cursor-default',
                  !revealed &&
                    'border-[var(--line-strong)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]',
                  revealed &&
                    isCorrect &&
                    'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]',
                  revealed &&
                    !isCorrect &&
                    isSelected &&
                    'border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]',
                  revealed &&
                    !isCorrect &&
                    !isSelected &&
                    'border-[var(--line)] opacity-55',
                )}
              >
                <span className="font-mono text-[11px] text-[var(--attention-ink)]">
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>

        {revealed && (
          <div className="space-y-3 border-t border-[var(--line)] pt-4">
            <p className="text-sm leading-7">
              {question.explanation}
            </p>
            {question.articleRefs.map((ref) => (
              <ArticleRef
                key={`${ref.lawId}-${ref.articleNo}`}
                law={ref.lawId}
                no={ref.articleNo}
              />
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={next} disabled={!revealed}>
            {isLast ? '提交结果' : '下一题 →'}
          </Button>
        </div>
      </section>
    </div>
  );
}
