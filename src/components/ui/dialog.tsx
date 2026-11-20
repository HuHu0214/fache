import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
};

export function Dialog({ open, onOpenChange, title, children }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <DialogPrimitive.Content className="hud-panel fixed left-1/2 top-1/2 z-50 w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 p-6 shadow-[0_0_40px_-10px_var(--accent)] focus:outline-none">
          <p className="hud-label">[ NOTICE ]</p>
          <DialogPrimitive.Title className="mt-1 text-lg font-semibold tracking-tight">
            {title}
          </DialogPrimitive.Title>
          <div className="mt-3 text-sm leading-7 text-[var(--ink)]">
            {children}
          </div>
          <div className="mt-6 flex justify-end">
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="inline-flex h-9 items-center rounded-[2px] border border-[var(--line-strong)] px-4 font-mono text-xs tracking-[0.12em] hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                知道了
              </button>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
