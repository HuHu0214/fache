import { useEffect, useState } from 'react';

const SESSION_KEY = 'fajing.booted';

export function BootOverlay() {
  const [visible, setVisible] = useState(
    () => sessionStorage.getItem(SESSION_KEY) !== '1',
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    const timer = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, '1');
      setVisible(false);
    }, 1400);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70] grid place-items-center bg-[var(--bg)]/95 backdrop-blur-md"
    >
      <div className="w-[min(80vw,28rem)] space-y-4 text-center">
        <p className="hud-label tracking-[0.4em] text-[var(--accent)]">
          LEGAL DATABASE // BOOT
        </p>
        <h2 className="font-mono text-2xl tracking-[0.3em] text-[var(--accent)]">
          法册
        </h2>
        <div className="h-[3px] w-full bg-[var(--line)]">
          <div className="boot-bar h-full bg-[var(--accent)]" />
        </div>
        <p className="font-mono text-[10px] tracking-[0.2em] text-[var(--muted)]">
          LOADING
        </p>
      </div>
    </div>
  );
}
