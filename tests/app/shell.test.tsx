import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppLayout from '../../src/app/AppLayout';

test('主导航只保留首页、法律、设置', async () => {
  localStorage.setItem('fajing.disclaimer', '1');
  render(
    <MemoryRouter>
      <AppLayout />
    </MemoryRouter>,
  );
  expect(
    await screen.findByRole('link', { name: '法律' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '设置' })).toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: '复习' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: '搜索' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: '笔记' }),
  ).not.toBeInTheDocument();
});

test('首次访问显示免责声明', () => {
  localStorage.clear();
  render(
    <MemoryRouter>
      <AppLayout />
    </MemoryRouter>,
  );
  expect(
    within(screen.getByRole('dialog')).getByText(/不构成法律意见/),
  ).toBeInTheDocument();
});
