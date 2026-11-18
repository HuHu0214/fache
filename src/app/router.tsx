import { createBrowserRouter } from 'react-router-dom';
import HomePage from '../features/home/HomePage';
import ScenarioPage from '../features/learning/ScenarioPage';
import ThemePage from '../features/learning/ThemePage';
import AppLayout from './AppLayout';
import NotFound from './NotFound';

function Placeholder({ title }: { title: string }) {
  return <p className="text-sm text-[var(--muted)]">{title}（建设中）</p>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'theme/:themeId',
        element: <ThemePage />,
      },
      {
        path: 'scenario/:scenarioId',
        element: <ScenarioPage />,
      },
      {
        path: 'concept/:kpId',
        element: <Placeholder title="知识点" />,
      },
      { path: 'law/:lawId', element: <Placeholder title="法律" /> },
      {
        path: 'law/:lawId/:articleNo',
        element: <Placeholder title="法条" />,
      },
      { path: 'review', element: <Placeholder title="复习" /> },
      { path: 'search', element: <Placeholder title="搜索" /> },
      { path: 'notes', element: <Placeholder title="笔记" /> },
      { path: 'settings', element: <Placeholder title="设置" /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
