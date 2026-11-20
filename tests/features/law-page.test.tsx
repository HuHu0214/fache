import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LawPage from '../../src/features/laws/LawPage';

test('法律页直接显示全文与条文目录', async () => {
  render(
    <MemoryRouter initialEntries={['/law/e-commerce-law']}>
      <LawPage lawId="e-commerce-law" />
    </MemoryRouter>,
  );

  expect(
    await screen.findByText(/为了保障电子商务各方主体的合法权益/),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: /第一章/ }),
  ).toBeInTheDocument();
  expect(
    screen
      .getAllByRole('link', { name: '第一条' })[0]
      ?.getAttribute('href'),
  ).toContain('article-');
  expect(
    screen.getByRole('button', { name: '标记第一条已学习' }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText('展开'),
  ).not.toBeInTheDocument();
});
