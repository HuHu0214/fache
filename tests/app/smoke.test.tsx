import { render, screen } from '@testing-library/react';
import App from '../../src/App';

test('显示应用名', () => {
  localStorage.setItem('fajing.disclaimer', '1');
  render(<App />);
  expect(screen.getByRole('heading', { name: '法径' })).toBeInTheDocument();
});
