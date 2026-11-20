import { useEffect, useState } from 'react';

const MIN = 0.8;
const MAX = 1.5;
const STEP = 0.1;

function clamp(value: number): number {
  return Math.min(MAX, Math.max(MIN, Math.round(value * 10) / 10));
}

function initialZoom(): number {
  const stored = Number(localStorage.getItem('fajing.zoom'));
  return Number.isFinite(stored) && stored > 0 ? clamp(stored) : 1;
}

export function DesktopZoom() {
  const desktop = window.fache?.isDesktop === true;
  const [zoom, setZoom] = useState(initialZoom);

  useEffect(() => {
    if (desktop) {
      void window.fache?.zoom.set(zoom);
    }
  }, [desktop, zoom]);

  if (!desktop) {
    return null;
  }

  const apply = (next: number) => {
    const value = clamp(next);
    setZoom(value);
    localStorage.setItem('fajing.zoom', String(value));
  };

  return (
    <div
      className="flex items-center border-2 border-[var(--line)] bg-[var(--card)] font-mono text-[10px] font-bold text-[var(--ink)]"
      aria-label="界面缩放"
    >
      <button
        type="button"
        aria-label="缩小界面"
        onClick={() => apply(zoom - STEP)}
        className="grid h-7 w-7 place-items-center border-r-2 border-[var(--line)] hover:bg-[var(--accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        −
      </button>
      <button
        type="button"
        aria-label="恢复 100% 缩放"
        onClick={() => apply(1)}
        className="h-7 min-w-12 px-1 text-center hover:bg-[var(--accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        aria-label="放大界面"
        onClick={() => apply(zoom + STEP)}
        className="grid h-7 w-7 place-items-center border-l-2 border-[var(--line)] hover:bg-[var(--accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        +
      </button>
    </div>
  );
}
