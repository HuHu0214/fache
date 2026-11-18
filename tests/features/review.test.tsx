import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ReviewPage from '../../src/features/review/ReviewPage';
import { rateKnowledgePoint } from '../../src/features/learning/rating';
import { db } from '../../src/lib/db';

beforeEach(async () => {
  await db.progress.clear();
});

test('无到期卡片时显示空状态', async () => {
  render(
    <MemoryRouter>
      <ReviewPage />
    </MemoryRouter>,
  );
  expect(
    await screen.findByText(/今天没有要复习的/),
  ).toBeInTheDocument();
});

test('有到期卡片时显示问题，展开答案后自评进入下一张', async () => {
  await rateKnowledgePoint(
    'contract-formation',
    'again',
    new Date('2026-11-01T00:00:00.000Z'),
  );
  render(
    <MemoryRouter>
      <ReviewPage />
    </MemoryRouter>,
  );
  expect(
    await screen.findByRole('heading', { name: '合同成立' }),
  ).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('button', { name: /显示答案/ }),
  );
  await userEvent.click(
    screen.getByRole('button', { name: '很熟' }),
  );
  expect(
    await screen.findByText(/今天没有要复习的/),
  ).toBeInTheDocument();
});
