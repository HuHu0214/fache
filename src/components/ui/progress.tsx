import { cn } from '../../lib/cn';

export type ProgressProps = {
  value: number;
  className?: string;
  label?: string;
};

export function Progress({ value, className, label }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={label}
      className={cn(
        'h-2 w-full overflow-hidden border border-[var(--line)] bg-[var(--card)]',
        className,
      )}
    >
      <div
        className="h-full bg-[var(--accent)] transition-[width]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
