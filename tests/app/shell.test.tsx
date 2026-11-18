import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppLayout from '../../src/app/AppLayout';

test('显示主导航', () => {
  localStorage.setItem('fajing.disclaimer', '1');
  render(
    <MemoryRouter>
      <AppLayout />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: '复习' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '搜索' })).toBeInTheDocument();
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
