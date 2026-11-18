import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import KnowledgePointPage from '../../src/features/learning/KnowledgePointPage';

test('知识点页显示一句话解释、法条与易混淆点', () => {
  render(
    <MemoryRouter initialEntries={['/concept/contract-formation']}>
      <KnowledgePointPage kpId="contract-formation" />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole('heading', { name: '合同成立' }),
  ).toBeInTheDocument();
  expect(screen.getByText(/第四百六十九条/)).toBeInTheDocument();
});
