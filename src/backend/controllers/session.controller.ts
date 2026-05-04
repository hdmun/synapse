import { db } from '../db';
import { messages } from '../db/schema';
import { eq, asc } from 'drizzle-orm';

export async function getSessionDetails(sessionId: string) {
  const msgs = await db.query.messages.findMany({
    where: eq(messages.sessionId, sessionId),
    orderBy: [asc(messages.timestamp)],
    with: {
      thoughts: true,
      toolCalls: true,
    }
  });

  return msgs;
}
