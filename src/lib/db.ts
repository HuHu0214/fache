import Dexie, { type Table } from 'dexie';
import type { Card } from 'ts-fsrs';

export type RatingInput = 'again' | 'good' | 'easy';

export type Progress = {
  kpId: string;
  state: 'touched' | 'learning' | 'review';
  card?: Card;
  due?: string;
  lastRating?: RatingInput;
  updatedAt: string;
};

export type TargetType = 'scenario' | 'kp';

export type Note = {
  id: string;
  targetType: TargetType;
  targetId: string;
  content: string;
  updatedAt: string;
};

export type Bookmark = {
  id: string;
  targetType: TargetType;
  targetId: string;
  createdAt: string;
};

export type Read = {
  scenarioId: string;
  readAt: string;
  rated: boolean;
};

export type Setting = {
  id: 'app';
  theme: 'light' | 'dark' | 'system';
  disclaimerAcceptedAt?: string;
  bonusXp?: number;
  lastChestAt?: string;
  soundEnabled?: boolean;
  freezeTokens?: number;
  frozenDates?: string[];
  bossCleared?: string[];
};

class FajingDatabase extends Dexie {
  progress!: Table<Progress, string>;
  notes!: Table<Note, string>;
  bookmarks!: Table<Bookmark, string>;
  reads!: Table<Read, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super('fajing');
    this.version(1).stores({
      progress: '&kpId, due, state',
      notes: '&id, targetType, targetId, updatedAt',
      bookmarks: '&id, targetType, targetId, createdAt',
      reads: '&scenarioId, readAt',
      settings: '&id',
    });
  }
}

export const db = new FajingDatabase();
