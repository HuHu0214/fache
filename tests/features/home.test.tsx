import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../../src/features/home/HomePage';
import { createFirstLawProgress } from '../../src/lib/ebbinghaus';
import { db } from '../../src/lib/db';

beforeEach(async () => {
  await Promise.all([
    db.lawProgress.clear(),
    db.settings.clear(),
    db.reads.clear(),
    db.progress.clear(),
  ]);
});

test('首页是艾宾浩斯法条看板，不再列主题场景', async () => {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
  expect(await screen.findByText('学习总览')).toBeInTheDocument();
  expect(screen.getByText('学习曲线')).toBeInTheDocument();
  expect(screen.getByText(/每日宝箱/)).toBeInTheDocument();
  expect(screen.getByText(/连续打卡/)).toBeInTheDocument();
  expect(screen.getByText('尚无学习记录', { exact: false })).toBeInTheDocument();
  expect(screen.queryByText(/口头说好的事/)).not.toBeInTheDocument();
});

test('只展示有进度的法律', async () => {
  await db.lawProgress.put(
    createFirstLawProgress(
      'e-commerce-law',
      '第一条',
      new Date('2026-11-20T09:00:00'),
    ),
  );

  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

  expect(
    await screen.findByText('电子商务法'),
  ).toBeInTheDocument();
  expect(screen.getByText('1/89')).toBeInTheDocument();
  expect(screen.queryByText('劳动法')).not.toBeInTheDocument();
});
