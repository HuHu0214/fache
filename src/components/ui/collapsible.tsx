import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import type { ReactElement, ReactNode } from 'react';

export type CollapsibleProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactElement;
  children: ReactNode;
};

export function Collapsible({
  open,
  onOpenChange,
  trigger,
  children,
}: CollapsibleProps) {
  return (
    <CollapsiblePrimitive.Root open={open} onOpenChange={onOpenChange}>
      <CollapsiblePrimitive.Trigger asChild>
        {trigger}
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content>{children}</CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
}
