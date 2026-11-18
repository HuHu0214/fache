import { useState, type ReactNode } from 'react';
import { Button } from '../ui/button';

export type RevealProps = {
  label: string;
  children: ReactNode;
  onOpenChange?: (open: boolean) => void;
};

export function Reveal({ label, children, onOpenChange }: RevealProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="my-4">
      {!open && (
        <Button
          variant="outline"
          onClick={() => {
            setOpen(true);
            onOpenChange?.(true);
          }}
        >
          {label}
        </Button>
      )}
      {open && <div>{children}</div>}
    </div>
  );
}
