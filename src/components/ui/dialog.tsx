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
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-xl focus:outline-none">
          <DialogPrimitive.Title className="text-lg font-semibold tracking-tight">
            {title}
          </DialogPrimitive.Title>
          <div className="mt-3 text-sm leading-7 text-[var(--ink)]">
            {children}
          </div>
          <div className="mt-6 flex justify-end">
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="inline-flex h-9 items-center rounded-lg border border-[var(--line)] px-4 text-sm font-medium hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] dark:hover:bg-white/5"
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
