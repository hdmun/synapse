import { Database } from 'bun:sqlite';
import path from 'path';

const userProfile = process.env.USERPROFILE || process.env.HOME || '';
const dbPath = path.join(userProfile, '.copilot', 'session-store.db');

try {
  console.log(`Checking DB at: ${dbPath}`);
  const db = new Database(dbPath, { readonly: true });
  
  // Table check
  const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("Tables found:", tables.map((t: any) => t.name).join(', '));

  // Schema check for 'sessions'
  const sessionCols = db.query("PRAGMA table_info(sessions)").all();
  console.log("Sessions columns:", sessionCols.map((c: any) => c.name).join(', '));

  // Schema check for 'turns'
  const turnCols = db.query("PRAGMA table_info(turns)").all();
  console.log("Turns columns:", turnCols.map((c: any) => c.name).join(', '));

  // Latest session check
  const latestSession = db.query("SELECT id, updated_at FROM sessions ORDER BY updated_at DESC LIMIT 1").get() as any;
  if (latestSession) {
    console.log(`Latest session ID: ${latestSession.id}, Updated at: ${latestSession.updated_at}`);
  } else {
    console.log("No sessions found in DB.");
  }

  db.close();
  console.log("DB check completed successfully.");
} catch (err: any) {
  console.error("Error checking Copilot DB:", err.message);
}
