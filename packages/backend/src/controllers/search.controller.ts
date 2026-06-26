import { sqlite } from '../db';

export async function searchMessages(query: string) {
  if (!query) return [];

  const results = sqlite.query(`
    SELECT m.*, s.project_id as projectId 
    FROM messages m
    JOIN messages_fts f ON m.rowid = f.rowid
    JOIN sessions s ON m.session_id = s.id
    WHERE f.content MATCH ?
    ORDER BY m.timestamp DESC
  `).all(query);
  
  return results;
}
