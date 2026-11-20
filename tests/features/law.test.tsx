import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ArticlePage from '../../src/features/laws/ArticlePage';

test('法条页显示原文与来源', async () => {
  render(
    <MemoryRouter
      initialEntries={['/law/civil-code/第四百六十三条']}
    >
      <ArticlePage lawId="civil-code" articleNo="第四百六十三条" />
    </MemoryRouter>,
  );
  expect(
    await screen.findByText(/本编调整因合同产生的民事关系/),
  ).toBeInTheDocument();
  expect(
    screen.getAllByText(/中华人民共和国民法典/).length,
  ).toBeGreaterThan(0);
});
