import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn';

const tones = {
  neutral: 'border-[var(--line)] bg-[var(--card)] text-[var(--ink)]',
  accent: 'border-[var(--line)] bg-[var(--accent)] text-[var(--on-accent)]',
  muted: 'border-[var(--line)] bg-transparent text-[var(--muted)]',
} as const;

export type BadgeProps = ComponentProps<'span'> & {
  tone?: keyof typeof tones;
};

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-none border-2 px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.1em]',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
