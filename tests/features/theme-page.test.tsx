import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ThemePage from '../../src/features/learning/ThemePage';

test('主题页列出全部知识点，包括没有场景直接引用的', async () => {
  render(
    <MemoryRouter>
      <ThemePage themeId="marriage" />
    </MemoryRouter>,
  );
  expect(
    await screen.findByRole('link', { name: '离婚冷静期' }),
  ).toHaveAttribute('href', '/concept/marriage-cooling-off');
});
