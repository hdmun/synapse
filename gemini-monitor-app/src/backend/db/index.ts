import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

const sqlite = new Database('gemini-monitor.db');
export const db = drizzle(sqlite, { schema });

// 1. 데이터베이스 초기화 및 FTS5 가상 테이블 생성 (기본 테이블은 Drizzle-kit으로 관리 가능하지만, FTS는 수동 관리 추천)
export async function initDb() {
  // FTS5 가상 테이블 생성 (검색 성능 최적화)
  // content 테이블은 messages의 내용을 미러링합니다.
  sqlite.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
      content,
      tokenize='unicode61'
    );
  `);

  // 트리거 생성: messages 테이블에 데이터가 들어오면 자동으로 fts 테이블에도 업데이트
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

  console.log('Database and FTS5 triggers initialized.');
}
