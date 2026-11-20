import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTheme } from '../../src/features/settings/useTheme';

function Probe({ name }: { name: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid={`theme-${name}`}>{theme}</span>
      <button onClick={() => setTheme('dark')}>set-{name}</button>
    </div>
  );
}

test('一个组件改主题，另一个组件同步', async () => {
  localStorage.clear();
  render(
    <>
      <Probe name="a" />
      <Probe name="b" />
    </>,
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'set-a' }),
  );
  expect(screen.getByTestId('theme-b')).toHaveTextContent('dark');
});
