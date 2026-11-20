import type { Read } from '../../lib/db';

export type PathStatus = 'complete' | 'current' | 'locked';

export type PathNodeState = {
  id: string;
  status: PathStatus;
};

export type GlobalUnit = {
  themeId: string;
  scenarioIds: string[];
};

export type GlobalPathNode = {
  kind: 'scenario' | 'boss';
  id: string;
  themeId: string;
  status: PathStatus;
};

export function buildGlobalPath(
  units: GlobalUnit[],
  reads: Read[],
  clearedBosses: string[],
): GlobalPathNode[] {
  const completed = new Set(
    reads.filter((read) => read.rated).map((read) => read.scenarioId),
  );
  const bosses = new Set(clearedBosses);
  const nodes: GlobalPathNode[] = [];
  let currentAssigned = false;

  for (const unit of units) {
    for (const id of unit.scenarioIds) {
      if (completed.has(id)) {
        nodes.push({
          kind: 'scenario',
          id,
          themeId: unit.themeId,
          status: 'complete',
        });
        continue;
      }
      if (!currentAssigned) {
        currentAssigned = true;
        nodes.push({
          kind: 'scenario',
          id,
          themeId: unit.themeId,
          status: 'current',
        });
        continue;
      }
      nodes.push({
        kind: 'scenario',
        id,
        themeId: unit.themeId,
        status: 'locked',
      });
    }

    const bossId = `boss:${unit.themeId}`;
    if (bosses.has(unit.themeId)) {
      nodes.push({
        kind: 'boss',
        id: bossId,
        themeId: unit.themeId,
        status: 'complete',
      });
      continue;
    }

    const unitComplete = unit.scenarioIds.every((id) =>
      completed.has(id),
    );
    if (!currentAssigned && unitComplete) {
      currentAssigned = true;
      nodes.push({
        kind: 'boss',
        id: bossId,
        themeId: unit.themeId,
        status: 'current',
      });
      continue;
    }

    nodes.push({
      kind: 'boss',
      id: bossId,
      themeId: unit.themeId,
      status: 'locked',
    });
  }

  return nodes;
}

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
