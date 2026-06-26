import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import * as schema from './schema';
import fs from 'fs';
import path from 'path';
import { loadConfig } from '@synapse/shared';

const config = loadConfig();
const isTest = process.env.NODE_ENV === 'test';
let dbPath = isTest ? ':memory:' : config.dbPath;

// Migrate legacy database if it exists
if (!isTest && !fs.existsSync(dbPath)) {
  const legacyDbPath = path.join(config.repoRoot, 'gemini-monitor.db');
  if (fs.existsSync(legacyDbPath)) {
    console.log(`[DB] Migrating legacy ${legacyDbPath} to ${dbPath}`);
    try {
      fs.copyFileSync(legacyDbPath, dbPath);
    } catch (e) {
      console.error(`[DB] Failed to copy legacy database:`, e);
    }
  }
}

export const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

let initPromise: Promise<void> | null = null;

export async function initDb() {
  if (initPromise) {
    return initPromise;
  }
  
  initPromise = (async () => {
    try {
      // Run migrations
      const migrationsFolder = path.resolve(import.meta.dir, '../../drizzle');
      console.log(`[DB] Running migrations from: ${migrationsFolder}`);
      const files = fs.readdirSync(migrationsFolder);
      console.log(`[DB] Migration files found:`, files);
      await migrate(db, { migrationsFolder });
      console.log(`[DB] Migrations applied successfully.`);

      // FTS5 가상 테이블 및 트리거 생성
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
    } catch (err: any) {
      console.error('Failed to initialize database:', err);
      // Reset promise so it can be retried
      initPromise = null;
      throw err;
    }
  })();
  
  return initPromise;
}
