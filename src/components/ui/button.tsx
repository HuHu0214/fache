import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn';

const variants = {
  default:
    'bg-[var(--accent)] text-white hover:opacity-90 border border-transparent',
  outline:
    'border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/5',
  ghost:
    'border border-transparent text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/5',
  danger:
    'bg-red-700 text-white hover:bg-red-800 border border-transparent',
} as const;

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
} as const;

export type ButtonProps = ComponentProps<'button'> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({
  variant = 'default',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
