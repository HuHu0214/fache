import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-[var(--radius-control)] border-2 border-[var(--line)] bg-[var(--card)] px-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]',
        className,
      )}
      {...props}
    />
  );
}
