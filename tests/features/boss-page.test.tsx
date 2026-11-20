import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BossPage from '../../src/features/boss/BossPage';
import { getBoss, getScenarios } from '../../src/content/registry';
import { db } from '../../src/lib/db';

beforeEach(async () => {
  await Promise.all([db.reads.clear(), db.settings.clear()]);
});

test('完成章节场景后可答 Boss，全部答对会通关并奖励', async () => {
  const scenarios = getScenarios('contracts');
  await db.reads.bulkPut(
    scenarios.map((scenario) => ({
      scenarioId: scenario.meta.id,
      readAt: new Date().toISOString(),
      rated: true,
    })),
  );

  const boss = getBoss('contracts');
  expect(boss).toBeTruthy();

  render(
    <MemoryRouter>
      <BossPage themeId="contracts" />
    </MemoryRouter>,
  );

  for (const question of boss!.questions) {
    const correct = question.options[question.answer];
    await userEvent.click(
      await screen.findByRole('button', {
        name: new RegExp(correct),
      }),
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: /下一题|提交结果/,
      }),
    );
  }

  expect(
    await screen.findByText(/章节已清算/),
  ).toBeInTheDocument();

  const setting = await db.settings.get('app');
  expect(setting?.bossCleared).toEqual(['contracts']);
  expect(setting?.bonusXp).toBe(100);
});
