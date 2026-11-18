import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn';

const tones = {
  neutral: 'bg-black/5 text-[var(--ink)] dark:bg-white/10',
  accent: 'bg-[var(--accent)]/10 text-[var(--accent)]',
  muted: 'bg-transparent text-[var(--muted)] border border-[var(--line)]',
} as const;

export type BadgeProps = ComponentProps<'span'> & {
  tone?: keyof typeof tones;
};

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
