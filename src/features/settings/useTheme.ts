import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'fajing.theme';

function readTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system'
    ? stored
    : 'system';
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
    return;
  }
  root.setAttribute('data-theme', theme);
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(readTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (next: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  };

  return { theme, setTheme };
}
