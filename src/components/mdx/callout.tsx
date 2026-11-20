import type { ReactNode } from 'react';

export type CalloutProps = {
  type?: 'tip' | 'warning' | 'info';
  children: ReactNode;
};

const styles = {
  tip: 'border-[var(--line)] bg-[var(--yellow)] text-[var(--ink)]',
  warning:
    'border-[var(--line)] bg-[var(--pink-soft)] text-[var(--ink)]',
  info: 'border-[var(--line)] bg-[var(--card)] text-[var(--ink)]',
} as const;

const labels: Record<'tip' | 'warning' | 'info', string | undefined> = {
  tip: '实务提示',
  warning: '注意',
  info: undefined,
};

export function Callout({ type = 'info', children }: CalloutProps) {
  const label = labels[type];

  return (
    <aside
      className={`my-4 border-2 px-4 py-3 text-sm leading-7 ${styles[type]}`}
    >
      {label && (
        <span className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-[0.14em]">
          {label}
        </span>
      )}
      <div className="font-medium">{children}</div>
    </aside>
  );
}
