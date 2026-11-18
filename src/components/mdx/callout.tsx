import type { ReactNode } from 'react';

export type CalloutProps = {
  type?: 'tip' | 'warning' | 'info';
  children: ReactNode;
};

const styles = {
  tip: 'border-[var(--accent)]/30 bg-[var(--accent)]/5',
  warning: 'border-amber-400/40 bg-amber-50/60 dark:bg-amber-900/10',
  info: 'border-[var(--line)] bg-[var(--card)]',
} as const;

const labels: Record<'tip' | 'warning' | 'info', string | undefined> = {
  tip: '实务提示',
  warning: '注意',
  info: undefined,
};

export function Callout({ type = 'info', children }: CalloutProps) {
  const label = labels[type];

  return (
    <aside className={`my-4 rounded-lg border px-4 py-3 text-sm leading-7 ${styles[type]}`}>
      {label && (
        <span className="mb-1 block text-xs font-medium text-[var(--muted)]">
          {label}
        </span>
      )}
      {children}
    </aside>
  );
}
