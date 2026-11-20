import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'fajing.theme';

function readTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system'
    ? stored
    : 'dark';
}

function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme !== 'system') {
    return theme;
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute(
    'data-theme',
    resolveTheme(theme),
  );
}

const THEME_EVENT = 'fajing:theme';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(readTheme);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') {
      return;
    }
    const media = window.matchMedia(
      '(prefers-color-scheme: light)',
    );
    const handler = () => applyTheme('system');
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);

  useEffect(() => {
    const handler = (event: Event) => {
      setThemeState((event as CustomEvent<ThemeMode>).detail);
    };
    window.addEventListener(THEME_EVENT, handler);
    return () => window.removeEventListener(THEME_EVENT, handler);
  }, []);

  const setTheme = (next: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
    window.dispatchEvent(
      new CustomEvent<ThemeMode>(THEME_EVENT, { detail: next }),
    );
  };

  return { theme, setTheme };
}
