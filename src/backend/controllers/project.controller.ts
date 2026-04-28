import { db } from '../db';
import { projects, sessions } from '../db/schema';
import { desc, eq } from 'drizzle-orm';
import { extractMessageSummary } from '../utils/message-utils';

export async function getProjects() {
  return await db.query.projects.findMany({
    orderBy: [desc(projects.lastUpdated)]
  });
}

export async function getProjectSessions(projectId: string) {
  const sessionList = await db.query.sessions.findMany({
    where: eq(sessions.projectId, projectId),
    orderBy: [desc(sessions.lastUpdated)],
    with: {
      messages: {
        orderBy: (msgs, { asc }) => [asc(msgs.timestamp)],
        limit: 1,
      }
    }
  });

  const sessionsWithSummary = await Promise.all(sessionList.map(async (s) => {
    const hasValidSummary = s.summary && !s.summary.trim().startsWith('{') && !s.summary.trim().startsWith('[');
    
    if (hasValidSummary) {
      const { messages, ...sessionData } = s;
      return sessionData;
    }

    let summary = s.summary;
    if (s.messages && s.messages.length > 0 && s.messages[0]) {
      const extracted = extractMessageSummary(s.messages[0].content);
      if (extracted) {
        summary = extracted;
        await db.update(sessions).set({ summary }).where(eq(sessions.id, s.id));
      }
    }
    
    const { messages, ...sessionData } = s;
    return { ...sessionData, summary };
  }));

  return sessionsWithSummary;
}
