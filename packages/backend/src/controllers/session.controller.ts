import { db } from '../db';
import { messages } from '../db/schema';
import { eq, asc } from 'drizzle-orm';

export async function getSessionDetails(sessionId: string) {
  const msgs = await db.query.messages.findMany({
    where: eq(messages.sessionId, sessionId),
    orderBy: [asc(messages.timestamp)],
  });

  return msgs.map(m => ({
    ...m,
    tokens: m.tokens ? JSON.parse(m.tokens) : undefined,
    toolCalls: m.toolCalls ? JSON.parse(m.toolCalls) : [],
    thoughtTraces: m.thoughtTraces ? JSON.parse(m.thoughtTraces) : [],
    enrichers: m.enrichers ? JSON.parse(m.enrichers) : undefined,
  }));
}
