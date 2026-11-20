import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn';

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-[var(--radius-control)] border-2 border-[var(--line)] bg-[var(--card)] p-3 text-sm leading-6 text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]',
        className,
      )}
      {...props}
    />
  );
}
