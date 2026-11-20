import type { ReactNode } from 'react';

export type CalloutProps = {
  type?: 'tip' | 'warning' | 'info';
  children: ReactNode;
};

const styles = {
  tip: 'border-[var(--amber)]/50 bg-[var(--amber-soft)]',
  warning: 'border-[var(--danger)]/50 bg-[var(--danger)]/10',
  info: 'border-[var(--line)] bg-[var(--panel)]',
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
      className={`my-4 rounded-[2px] border px-4 py-3 text-sm leading-7 ${styles[type]}`}
    >
      {label && <span className="hud-label mb-1 block">{label}</span>}
      {children}
    </aside>
  );
}
