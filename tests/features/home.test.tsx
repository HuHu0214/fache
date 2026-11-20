import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../../src/features/home/HomePage';
import { db } from '../../src/lib/db';

beforeEach(async () => {
  await Promise.all([db.reads.clear(), db.progress.clear()]);
});

test('首页显示学习航线和当前节点', async () => {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
  expect(await screen.findByText(/法径航线/)).toBeInTheDocument();
  expect(
    await screen.findByRole('link', {
      name: '口头说好的事，算数吗？',
    }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('link', {
      name: '对方收了钱不办事，我能怎么办？',
    }),
  ).not.toBeInTheDocument();
});
