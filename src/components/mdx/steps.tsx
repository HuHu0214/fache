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
    <li className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-4 py-3">
      <h3 className="text-base font-medium">{title}</h3>
      <div className="mt-1 text-sm leading-7">{children}</div>
    </li>
  );
}
