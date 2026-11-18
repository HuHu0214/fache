import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../../src/features/home/HomePage';
import { db } from '../../src/lib/db';

beforeEach(async () => {
  await Promise.all([db.reads.clear(), db.progress.clear()]);
});

test('无学习数据时显示引导而不是空白', async () => {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
  expect(
    await screen.findByText(/从第一个场景开始/),
  ).toBeInTheDocument();
});
