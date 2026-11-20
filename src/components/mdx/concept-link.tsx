import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getKnowledgePoint } from '../../content/registry';

export type ConceptLinkProps = {
  id: string;
  children?: ReactNode;
};

export function ConceptLink({ id, children }: ConceptLinkProps) {
  const entry = getKnowledgePoint(id);

  if (!entry) {
    return (
      <span role="alert" className="text-red-700">
        {children ?? id}
      </span>
    );
  }

  return (
    <Link
      to={`/concept/${id}`}
      className="font-medium text-[var(--accent)] underline decoration-2 underline-offset-2 hover:bg-[var(--accent-soft)]"
    >
      {children ?? entry.meta.title}
    </Link>
  );
}
