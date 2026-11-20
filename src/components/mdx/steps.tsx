import type { ReactNode } from 'react';

export function Steps({ children }: { children: ReactNode }) {
  return (
    <ol className="steps-list my-4 space-y-4">{children}</ol>
  );
}

export function Step({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="step-item hud-panel relative py-3 pl-14 pr-4">
      <h3 className="text-base font-black">{title}</h3>
      <div className="mt-1 text-sm leading-7">{children}</div>
    </li>
  );
}
