import type {
  Bookmark,
  LawProgress,
  Note,
  Progress,
  Read,
  Setting,
} from '../lib/db';

export type SqliteSnapshot = {
  version: number;
  lawProgress: LawProgress[];
  settings: Setting[];
  progress: Progress[];
  notes: Note[];
  bookmarks: Bookmark[];
  reads: Read[];
};

export type FacheBridge = {
  isDesktop: true;
  platform: string;
  storage: {
    load: () => Promise<SqliteSnapshot>;
    save: (snapshot: SqliteSnapshot) => Promise<{
      ok: boolean;
      updatedAt: string;
    }>;
    clear: () => Promise<{ ok: boolean; updatedAt: string }>;
  };
  zoom: {
    set: (value: number) => Promise<number>;
  };
  info: () => Promise<{
    version: string;
    platform: string;
    dbPath: string;
  }>;
};

declare global {
  interface Window {
    fache?: FacheBridge;
  }
}

export {};
