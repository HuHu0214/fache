import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-[2px] border border-[var(--line-strong)] bg-[var(--bg-elev)] px-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]',
        className,
      )}
      {...props}
    />
  );
}
