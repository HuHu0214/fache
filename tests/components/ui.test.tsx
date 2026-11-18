import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../src/components/ui/button';
import { Dialog } from '../../src/components/ui/dialog';

test('Button 可点击', async () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>开始</Button>);
  await userEvent.click(screen.getByRole('button', { name: '开始' }));
  expect(onClick).toHaveBeenCalledOnce();
});

test('Dialog 打开时显示标题', () => {
  render(
    <Dialog open onOpenChange={() => {}} title="免责声明">
      内容
    </Dialog>,
  );
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('免责声明')).toBeInTheDocument();
});
