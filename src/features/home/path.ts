import type { Read } from '../../lib/db';

export type PathStatus = 'complete' | 'current' | 'locked';

export type PathNodeState = {
  id: string;
  status: PathStatus;
};

export function buildThemePath(
  scenarioIds: string[],
  reads: Read[],
): PathNodeState[] {
  const completed = new Set(
    reads.filter((read) => read.rated).map((read) => read.scenarioId),
  );
  let currentAssigned = false;

  return scenarioIds.map((id) => {
    if (completed.has(id)) {
      return { id, status: 'complete' };
    }
    if (!currentAssigned) {
      currentAssigned = true;
      return { id, status: 'current' };
    }
    return { id, status: 'locked' };
  });
}
