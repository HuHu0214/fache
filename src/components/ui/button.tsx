import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn';

const variants = {
  default:
    'border border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)] shadow-[0_0_20px_-8px_var(--accent)] hover:brightness-110',
  outline:
    'border border-[var(--line-strong)] bg-transparent text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
  ghost:
    'border border-transparent text-[var(--ink)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]',
  danger:
    'border border-[var(--danger)] bg-[var(--danger)] text-white hover:brightness-110',
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
        'inline-flex items-center justify-center gap-2 rounded-[2px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
