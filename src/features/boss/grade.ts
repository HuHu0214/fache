import type { BossQuestion } from '../../content/boss-schema';

export type BossResult = {
  score: number;
  total: number;
  passed: boolean;
};

export function gradeBoss(
  questions: BossQuestion[],
  answers: Array<number | undefined>,
  passScore: number,
): BossResult {
  let score = 0;
  questions.forEach((question, index) => {
    if (answers[index] === question.answer) {
      score += 1;
    }
  });
  return {
    score,
    total: questions.length,
    passed: score >= passScore,
  };
}
