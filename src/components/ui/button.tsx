import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn';

const variants = {
  default:
    'border-[3px] border-[var(--line)] bg-[var(--accent)] text-[var(--on-accent)] shadow-[4px_4px_0_var(--shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_var(--shadow)]',
  outline:
    'border-[3px] border-[var(--line)] bg-[var(--card)] text-[var(--ink)] shadow-[4px_4px_0_var(--shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_var(--shadow)]',
  ghost:
    'border-[2px] border-transparent text-[var(--ink)] hover:border-[var(--line)] hover:bg-[var(--paper)]',
  danger:
    'border-[3px] border-[var(--line)] bg-[var(--danger)] text-white shadow-[4px_4px_0_var(--shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_var(--shadow)]',
} as const;

const sizes = {
  sm: 'h-8 px-3 text-xs',
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
        'inline-flex items-center justify-center gap-2 rounded-none font-bold transition-[transform,box-shadow,background-color] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
