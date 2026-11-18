import { createBrowserRouter } from 'react-router-dom';
import HomePage from '../features/home/HomePage';
import KnowledgePointPage from '../features/learning/KnowledgePointPage';
import ScenarioPage from '../features/learning/ScenarioPage';
import ThemePage from '../features/learning/ThemePage';
import ArticlePage from '../features/laws/ArticlePage';
import LawPage from '../features/laws/LawPage';
import NotesPage from '../features/notes/NotesPage';
import ReviewPage from '../features/review/ReviewPage';
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
        element: <KnowledgePointPage />,
      },
      { path: 'law/:lawId', element: <LawPage /> },
      {
        path: 'law/:lawId/:articleNo',
        element: <ArticlePage />,
      },
      { path: 'review', element: <ReviewPage /> },
      { path: 'search', element: <Placeholder title="搜索" /> },
      { path: 'notes', element: <NotesPage /> },
      { path: 'settings', element: <Placeholder title="设置" /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
