import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import * as schema from './schema';

const isTest = process.env.NODE_ENV === 'test';
const dbPath = isTest ? ':memory:' : (process.env.DATABASE_URL || 'gemini-monitor.db');

export const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

export async function initDb() {
  // 1. Run migrations
  migrate(db, { migrationsFolder: './drizzle' });

  // 2. FTS5 가상 테이블 및 트리거 생성 (기존 로직 유지)
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

  if (isTest) {
    console.log('In-memory database initialized for testing.');
  } else {
    console.log(`Database initialized at: ${dbPath}`);
  }
}
