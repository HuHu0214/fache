import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from '../../src/features/settings/SettingsPage';

test('设置页显示法修档案与成就', async () => {
  render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
  expect(await screen.findByText('法修档案')).toBeInTheDocument();
  expect(screen.getByText('成就')).toBeInTheDocument();
  expect(screen.getByText('初窥法门')).toBeInTheDocument();
});
