import { cn } from '../../lib/cn';

export function Separator({ className }: { className?: string }) {
  return (
    <div
      role="separator"
      className={cn('h-[3px] w-full bg-[var(--line)]', className)}
    />
  );
}
