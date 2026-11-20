import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from '../../src/features/settings/SettingsPage';

test('设置页保留外观与卷宗管理，成就已移至首页', () => {
  render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
  expect(screen.getByText('设置')).toBeInTheDocument();
  expect(screen.getByText('外观')).toBeInTheDocument();
  expect(screen.getByText('卷宗管理')).toBeInTheDocument();
  expect(screen.queryByText('成就')).not.toBeInTheDocument();
});
