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
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/70" />
        <DialogPrimitive.Content className="hud-panel fixed left-1/2 top-1/2 z-50 w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 p-6 focus:outline-none">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="hud-label">[ NOTICE ]</p>
            <span className="stamp">法径</span>
          </div>
          <DialogPrimitive.Title className="mt-1 text-xl font-black tracking-tight">
            {title}
          </DialogPrimitive.Title>
          <div className="mt-3 text-sm leading-7 text-[var(--ink)]">
            {children}
          </div>
          <div className="mt-6 flex justify-end">
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="inline-flex h-9 items-center border-[3px] border-[var(--line)] bg-[var(--accent)] px-4 font-mono text-xs font-bold tracking-[0.12em] text-[var(--on-accent)] shadow-[3px_3px_0_var(--shadow)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent)]"
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
