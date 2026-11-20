import type { CSSProperties } from 'react';

const COLORS = [
  'var(--accent)',
  'var(--amber)',
  'var(--yellow)',
];

export function ParticleBurst({ count = 28 }: { count?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[80] grid place-items-center"
    >
      {Array.from({ length: count }).map((_, index) => {
        const angle =
          (index / count) * Math.PI * 2 + (index % 3) * 0.18;
        const distance = 70 + (index % 6) * 24;
        const style = {
          '--dx': `${Math.cos(angle) * distance}px`,
          '--dy': `${Math.sin(angle) * distance}px`,
          background: COLORS[index % COLORS.length],
          animationDelay: `${(index % 5) * 18}ms`,
        } as CSSProperties;

        return <span key={index} className="particle" style={style} />;
      })}
    </div>
  );
}
