import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn';

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-[2px] border border-[var(--line-strong)] bg-[var(--bg-elev)] p-3 text-sm leading-6 text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]',
        className,
      )}
      {...props}
    />
  );
}
