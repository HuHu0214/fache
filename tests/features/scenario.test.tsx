import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ScenarioPage from '../../src/features/learning/ScenarioPage';
import { db } from '../../src/lib/db';

beforeEach(async () => {
  await Promise.all([db.progress.clear(), db.reads.clear()]);
});

test('答案默认收起，点击后展开并出现自评', async () => {
  render(
    <MemoryRouter initialEntries={['/scenario/contract-formation']}>
      <ScenarioPage scenarioId="contract-formation" />
    </MemoryRouter>,
  );
  expect(
    screen.getByText('口头说好的事，算数吗？'),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: '大概懂了' }),
  ).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('button', { name: /展开答案/ }),
  );
  expect(
    screen.getByRole('button', { name: '大概懂了' }),
  ).toBeInTheDocument();
});

test('自评写入主知识点的进度', async () => {
  render(
    <MemoryRouter initialEntries={['/scenario/contract-formation']}>
      <ScenarioPage scenarioId="contract-formation" />
    </MemoryRouter>,
  );
  await userEvent.click(
    screen.getByRole('button', { name: /展开答案/ }),
  );
  await userEvent.click(
    screen.getByRole('button', { name: '大概懂了' }),
  );
  await vi.waitFor(async () => {
    expect(await db.progress.get('contract-formation')).toBeTruthy();
  });
});
