import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn';

const tones = {
  neutral:
    'border border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink)]',
  accent:
    'border border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]',
  muted:
    'border border-[var(--line)] bg-transparent text-[var(--muted)]',
} as const;

export type BadgeProps = ComponentProps<'span'> & {
  tone?: keyof typeof tones;
};

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[2px] px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.12em]',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
