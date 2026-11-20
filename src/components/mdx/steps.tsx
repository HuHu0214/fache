import type { ReactNode } from 'react';

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="my-4 space-y-4">{children}</ol>;
}

export function Step({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="hud-panel px-4 py-3">
      <h3 className="flex items-center gap-2 text-base font-medium">
        <span
          className="h-2.5 w-1 bg-[var(--accent)]"
          aria-hidden="true"
        />
        {title}
      </h3>
      <div className="mt-1 text-sm leading-7">{children}</div>
    </li>
  );
}
