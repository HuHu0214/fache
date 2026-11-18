import { createBrowserRouter } from 'react-router-dom';
import HomePage from '../features/home/HomePage';
import KnowledgePointPage from '../features/learning/KnowledgePointPage';
import ScenarioPage from '../features/learning/ScenarioPage';
import ThemePage from '../features/learning/ThemePage';
import ArticlePage from '../features/laws/ArticlePage';
import LawPage from '../features/laws/LawPage';
import NotesPage from '../features/notes/NotesPage';
import ReviewPage from '../features/review/ReviewPage';
import SearchPage from '../features/search/SearchPage';
import SettingsPage from '../features/settings/SettingsPage';
import AppLayout from './AppLayout';
import NotFound from './NotFound';

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
      { path: 'search', element: <SearchPage /> },
      { path: 'notes', element: <NotesPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
