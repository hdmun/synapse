import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

const sqlite = new Database('gemini-monitor.db');
export const db = drizzle(sqlite, { schema });

export async function initDb() {
  // 1. 기본 테이블 수동 생성 (messages 테이블이 존재해야 트리거 생성 가능)
  sqlite.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL,
      name TEXT NOT NULL,
      total_tokens INTEGER DEFAULT 0,
      progress REAL DEFAULT 0,
      last_updated INTEGER NOT NULL
    );
  `);

  sqlite.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id),
      start_time INTEGER NOT NULL,
      last_updated INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      model TEXT,
      total_tokens INTEGER DEFAULT 0
    );
  `);

  sqlite.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES sessions(id),
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      input_tokens INTEGER,
      output_tokens INTEGER,
      thought_tokens INTEGER
    );
  `);

  sqlite.run(`
    CREATE TABLE IF NOT EXISTS thoughts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT REFERENCES messages(id),
      subject TEXT,
      description TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );
  `);

  sqlite.run(`
    CREATE TABLE IF NOT EXISTS tool_calls (
      id TEXT PRIMARY KEY,
      message_id TEXT REFERENCES messages(id),
      name TEXT NOT NULL,
      args TEXT,
      result TEXT,
      status TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );
  `);

  sqlite.run(`
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES sessions(id),
      project_id TEXT REFERENCES projects(id),
      content TEXT NOT NULL,
      total_tasks INTEGER DEFAULT 0,
      completed_tasks INTEGER DEFAULT 0,
      last_updated INTEGER NOT NULL
    );
  `);

  // 2. FTS5 가상 테이블 및 트리거 생성 (기존 로직)
  sqlite.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
      content,
      tokenize='unicode61'
    );
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS messages_after_insert AFTER INSERT ON messages BEGIN
      INSERT INTO messages_fts(rowid, content) VALUES (new.rowid, new.content);
    END;
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS messages_after_delete AFTER DELETE ON messages BEGIN
      DELETE FROM messages_fts WHERE rowid = old.rowid;
    END;
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS messages_after_update AFTER UPDATE ON messages BEGIN
      UPDATE messages_fts SET content = new.content WHERE rowid = old.rowid;
    END;
  `);

  console.log('Database, tables, and FTS5 triggers initialized.');
}
