import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ScenarioPage from '../../src/features/learning/ScenarioPage';

test('场景页在窄屏下主要内容有容器且不固定宽度', () => {
  render(
    <MemoryRouter>
      <ScenarioPage scenarioId="contract-formation" />
    </MemoryRouter>,
  );
  expect(document.querySelector('.page-shell')).toBeTruthy();
  expect(document.querySelector('[data-fixed-width="true"]')).toBeNull();
});
