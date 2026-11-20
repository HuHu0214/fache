'use strict';

const { DatabaseSync } = require('node:sqlite');

const LEGACY_TABLES = ['progress', 'notes', 'bookmarks', 'reads'];

function emptySnapshot() {
  return {
    version: 2,
    lawProgress: [],
    settings: [],
    progress: [],
    notes: [],
    bookmarks: [],
    reads: [],
  };
}

class FacheDatabase {
  constructor(filePath) {
    this.filePath = filePath;
    this.db = new DatabaseSync(filePath);
    this.db.exec('PRAGMA journal_mode = WAL');
    this.db.exec('PRAGMA synchronous = NORMAL');
    this.db.exec('PRAGMA busy_timeout = 3000');
    this.#migrate();
  }

  #migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS law_progress (
        id TEXT PRIMARY KEY,
        law_id TEXT NOT NULL,
        article_no TEXT NOT NULL,
        stage INTEGER NOT NULL,
        learn_count INTEGER NOT NULL,
        first_learned_at TEXT NOT NULL,
        last_studied_at TEXT NOT NULL,
        next_due_at TEXT NOT NULL,
        study_days TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_law_progress_law
        ON law_progress(law_id);
      CREATE INDEX IF NOT EXISTS idx_law_progress_due
        ON law_progress(next_due_at);

      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS legacy_records (
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        data TEXT NOT NULL,
        PRIMARY KEY (table_name, record_id)
      );
    `);

    this.db
      .prepare(
        'INSERT OR REPLACE INTO meta(key, value) VALUES (?, ?)',
      )
      .run('schema_version', '2');
  }

  loadAll() {
    const lawProgress = this.db
      .prepare(
        `SELECT id, law_id, article_no, stage, learn_count,
                first_learned_at, last_studied_at, next_due_at,
                study_days
         FROM law_progress`,
      )
      .all()
      .map((row) => ({
        id: row.id,
        lawId: row.law_id,
        articleNo: row.article_no,
        stage: row.stage,
        learnCount: row.learn_count,
        firstLearnedAt: row.first_learned_at,
        lastStudiedAt: row.last_studied_at,
        nextDueAt: row.next_due_at,
        studyDays: JSON.parse(row.study_days),
      }));

    const settings = this.db
      .prepare('SELECT data FROM settings')
      .all()
      .map((row) => JSON.parse(row.data));

    const snapshot = { ...emptySnapshot(), lawProgress, settings };
    for (const row of this.db
      .prepare(
        'SELECT table_name, data FROM legacy_records',
      )
      .all()) {
      if (LEGACY_TABLES.includes(row.table_name)) {
        snapshot[row.table_name].push(JSON.parse(row.data));
      }
    }

    return snapshot;
  }

  saveAll(input) {
    const snapshot = { ...emptySnapshot(), ...input };
    const now = new Date().toISOString();

    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.exec(`
        DELETE FROM law_progress;
        DELETE FROM settings;
        DELETE FROM legacy_records;
      `);

      const insertProgress = this.db.prepare(
        `INSERT INTO law_progress
          (id, law_id, article_no, stage, learn_count,
           first_learned_at, last_studied_at, next_due_at,
           study_days)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const record of snapshot.lawProgress ?? []) {
        insertProgress.run(
          record.id,
          record.lawId,
          record.articleNo,
          record.stage,
          record.learnCount,
          record.firstLearnedAt,
          record.lastStudiedAt,
          record.nextDueAt,
          JSON.stringify(record.studyDays ?? []),
        );
      }

      const insertSetting = this.db.prepare(
        'INSERT INTO settings(id, data) VALUES (?, ?)',
      );
      for (const setting of snapshot.settings ?? []) {
        insertSetting.run(setting.id, JSON.stringify(setting));
      }

      const insertLegacy = this.db.prepare(
        `INSERT INTO legacy_records(table_name, record_id, data)
         VALUES (?, ?, ?)`,
      );
      for (const table of LEGACY_TABLES) {
        for (const record of snapshot[table] ?? []) {
          const recordId =
            table === 'progress'
              ? record.kpId
              : table === 'reads'
                ? record.scenarioId
                : record.id;
          insertLegacy.run(
            table,
            String(recordId),
            JSON.stringify(record),
          );
        }
      }

      this.db
        .prepare(
          'INSERT OR REPLACE INTO meta(key, value) VALUES (?, ?)',
        )
        .run('updated_at', now);
      this.db.exec('COMMIT');
      return { ok: true, updatedAt: now };
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  clearAll() {
    return this.saveAll(emptySnapshot());
  }

  close() {
    this.db.close();
  }
}

module.exports = { FacheDatabase };
