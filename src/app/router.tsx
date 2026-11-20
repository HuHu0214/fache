import {
  createBrowserRouter,
  createHashRouter,
} from 'react-router-dom';
import HomePage from '../features/home/HomePage';
import ArticlePage from '../features/laws/ArticlePage';
import LawPage from '../features/laws/LawPage';
import LawsPage from '../features/laws/LawsPage';
import StudyPage from '../features/laws/StudyPage';
import SettingsPage from '../features/settings/SettingsPage';
import AppLayout from './AppLayout';
import NotFound from './NotFound';

const routes = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'laws', element: <LawsPage /> },
      { path: 'law/:lawId', element: <LawPage /> },
      {
        path: 'law/:lawId/:articleNo',
        element: <ArticlePage />,
      },
      { path: 'study', element: <StudyPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];

const desktop =
  typeof window !== 'undefined' &&
  (window.fache?.isDesktop === true ||
    window.location.protocol === 'file:');

export const router = desktop
  ? createHashRouter(routes)
  : createBrowserRouter(routes);
