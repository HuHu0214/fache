import { db } from './db';
import type { SqliteSnapshot } from '../types/fache';

let hydrated = false;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let saving = false;
let queued = false;

function bridge() {
  return typeof window !== 'undefined' ? window.fache : undefined;
}

export function isDesktopClient(): boolean {
  return bridge()?.isDesktop === true;
}

async function emptyLocalDatabase(): Promise<boolean> {
  const counts = await Promise.all([
    db.lawProgress.count(),
    db.settings.count(),
    db.progress.count(),
    db.notes.count(),
    db.bookmarks.count(),
    db.reads.count(),
  ]);
  return counts.every((count) => count === 0);
}

export async function exportLocalSnapshot(): Promise<SqliteSnapshot> {
  const [lawProgress, settings, progress, notes, bookmarks, reads] =
    await Promise.all([
      db.lawProgress.toArray(),
      db.settings.toArray(),
      db.progress.toArray(),
      db.notes.toArray(),
      db.bookmarks.toArray(),
      db.reads.toArray(),
    ]);

  return {
    version: 2,
    lawProgress,
    settings,
    progress,
    notes,
    bookmarks,
    reads,
  };
}

async function replaceLocalSnapshot(
  snapshot: SqliteSnapshot,
): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.lawProgress,
      db.settings,
      db.progress,
      db.notes,
      db.bookmarks,
      db.reads,
    ],
    async () => {
      await Promise.all([
        db.lawProgress.clear(),
        db.settings.clear(),
        db.progress.clear(),
        db.notes.clear(),
        db.bookmarks.clear(),
        db.reads.clear(),
      ]);
      if (snapshot.lawProgress.length > 0) {
        await db.lawProgress.bulkPut(snapshot.lawProgress);
      }
      if (snapshot.settings.length > 0) {
        await db.settings.bulkPut(snapshot.settings);
      }
      if (snapshot.progress.length > 0) {
        await db.progress.bulkPut(snapshot.progress);
      }
      if (snapshot.notes.length > 0) {
        await db.notes.bulkPut(snapshot.notes);
      }
      if (snapshot.bookmarks.length > 0) {
        await db.bookmarks.bulkPut(snapshot.bookmarks);
      }
      if (snapshot.reads.length > 0) {
        await db.reads.bulkPut(snapshot.reads);
      }
    },
  );
}

function hasSnapshotData(snapshot: SqliteSnapshot): boolean {
  return (
    snapshot.lawProgress.length > 0 ||
    snapshot.settings.length > 0 ||
    snapshot.progress.length > 0 ||
    snapshot.notes.length > 0 ||
    snapshot.bookmarks.length > 0 ||
    snapshot.reads.length > 0
  );
}

export async function hydrateFromSqlite(): Promise<void> {
  const api = bridge()?.storage;
  if (!api || hydrated) {
    return;
  }
  hydrated = true;

  try {
    const snapshot = await api.load();
    if (hasSnapshotData(snapshot)) {
      await replaceLocalSnapshot(snapshot);
      return;
    }
    if (!(await emptyLocalDatabase())) {
      await flushSqlite();
    }
  } catch (error) {
    console.error('SQLite hydration failed', error);
  }
}

export async function flushSqlite(): Promise<void> {
  const api = bridge()?.storage;
  if (!api) {
    return;
  }
  if (saving) {
    queued = true;
    return;
  }

  saving = true;
  try {
    await api.save(await exportLocalSnapshot());
  } catch (error) {
    console.error('SQLite save failed', error);
  } finally {
    saving = false;
    if (queued) {
      queued = false;
      scheduleSqliteSave();
    }
  }
}

export function scheduleSqliteSave(): void {
  if (!bridge()?.storage) {
    return;
  }
  if (pendingTimer) {
    clearTimeout(pendingTimer);
  }
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    void flushSqlite();
  }, 80);
}
