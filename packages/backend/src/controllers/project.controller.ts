import { db } from '../db';
import { projects, sessions, messages } from '../db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { extractMessageSummary } from '@synapse/shared';

export async function getProjects() {
  const allProjects = await db.query.projects.findMany({
    orderBy: [desc(projects.lastUpdated)],
    with: {
      sessions: {
        columns: {
          source: true
        }
      }
    }
  });

  return allProjects.map(p => {
    const agents = Array.from(new Set(p.sessions.map(s => s.source).filter(Boolean)));
    const { sessions, ...projectData } = p;
    return { ...projectData, agents };
  });
}

export async function getTokenStats() {
  const stats = await db.select({
    projectName: projects.name,
    totalBaseTokens: sql<number>`COALESCE(SUM(CAST(json_extract(${sessions.totalTokens}, '$.base') AS INTEGER)), 0)`,
    totalReasoningTokens: sql<number>`COALESCE(SUM(CAST(json_extract(${sessions.totalTokens}, '$.reasoning') AS INTEGER)), 0)`,
    totalCost: sql<number>`COALESCE(SUM(CASE WHEN ${sessions.estimatedCost} IS NOT NULL THEN ${sessions.estimatedCost} ELSE 0 END), 0)`
  })
  .from(projects)
  .leftJoin(sessions, eq(sessions.projectId, projects.id))
  .groupBy(projects.id, projects.name)
  .orderBy(desc(sql<number>`COALESCE(SUM(CAST(json_extract(${sessions.totalTokens}, '$.base') AS INTEGER)), 0)`));

  return stats.map(s => {
    const baseTokens = Number(s.totalBaseTokens) || 0;
    const reasoningTokens = Number(s.totalReasoningTokens) || 0;
    return {
      name: s.projectName,
      tokens: baseTokens + reasoningTokens,
      baseTokens,
      reasoningTokens,
      estimatedCost: Number(s.totalCost) || 0,
    };
  });
}

export async function getOverviewStats() {
  const [tokenAgg] = await db.select({
    totalBaseTokens: sql<number>`COALESCE(SUM(CAST(json_extract(${sessions.totalTokens}, '$.base') AS INTEGER)), 0)`,
    totalReasoningTokens: sql<number>`COALESCE(SUM(CAST(json_extract(${sessions.totalTokens}, '$.reasoning') AS INTEGER)), 0)`,
    totalEstimatedCost: sql<number>`COALESCE(SUM(CASE WHEN ${sessions.estimatedCost} IS NOT NULL THEN ${sessions.estimatedCost} ELSE 0 END), 0)`,
    totalSessions: sql<number>`COUNT(${sessions.id})`
  }).from(sessions);

  const distinctAgents = await db.selectDistinct({
    source: sessions.source
  }).from(sessions);

  const costSupportedRows = await db.selectDistinct({
    source: sessions.source
  }).from(sessions).where(sql`${sessions.estimatedCost} IS NOT NULL AND ${sessions.estimatedCost} > 0`);

  const base = Number(tokenAgg?.totalBaseTokens) || 0;
  const reasoning = Number(tokenAgg?.totalReasoningTokens) || 0;

  return {
    totalTokens: base + reasoning,
    baseTokens: base,
    reasoningTokens: reasoning,
    totalEstimatedCost: Number(tokenAgg?.totalEstimatedCost) || 0,
    totalSessions: Number(tokenAgg?.totalSessions) || 0,
    activeAgents: distinctAgents.map(a => a.source).filter(Boolean),
    costSupportedAgents: costSupportedRows.map(a => a.source).filter(Boolean),
  };
}

export async function getActivityStats() {
  const stats = await db.select({
    date: sql<string>`strftime('%Y-%m-%d', datetime(${sessions.startTime} / 1000, 'unixepoch'))`,
    count: sql<number>`count(${sessions.id})`
  })
  .from(sessions)
  .groupBy(sql`strftime('%Y-%m-%d', datetime(${sessions.startTime} / 1000, 'unixepoch'))`)
  .orderBy(sql`strftime('%Y-%m-%d', datetime(${sessions.startTime} / 1000, 'unixepoch'))`);

  return stats.map(s => {
    const c = Number(s.count);
    let level = 0;
    if (c > 0) level = 1;
    if (c > 3) level = 2;
    if (c > 6) level = 3;
    if (c > 10) level = 4;
    
    return {
      date: s.date,
      count: c,
      level
    };
  });
}

export async function getProjectSessions(projectId: string) {

  // Use a query with left join for message count
  const sessionList = await db.select({
    id: sessions.id,
    projectId: sessions.projectId,
    source: sessions.source,
    startTime: sessions.startTime,
    lastUpdated: sessions.lastUpdated,
    status: sessions.status,
    model: sessions.model,
    summary: sessions.summary,
    totalTokens: sessions.totalTokens,
    estimatedCost: sessions.estimatedCost,
    messageCount: sql<number>`COUNT(${messages.id})`
  })
  .from(sessions)
  .leftJoin(messages, eq(messages.sessionId, sessions.id))
  .where(eq(sessions.projectId, projectId))
  .groupBy(sessions.id)
  .orderBy(desc(sessions.lastUpdated));

  // Backfill summaries if needed while processing results
  const result = await Promise.all(sessionList.map(async (s) => {
    const hasValidSummary = s.summary && !s.summary.trim().startsWith('{') && !s.summary.trim().startsWith('[');
    
    // Parse JSON totalTokens
    const totalTokens = s.totalTokens ? JSON.parse(s.totalTokens) : undefined;
    const sessionWithParsed = { ...s, totalTokens };

    if (hasValidSummary || s.messageCount === 0) {
      return sessionWithParsed;
    }

    // Attempt to backfill summary from the first message
    const firstMsg = await db.query.messages.findFirst({
      where: eq(messages.sessionId, s.id),
      orderBy: (msgs, { asc }) => [asc(msgs.timestamp)]
    });

    if (firstMsg) {
      const summary = extractMessageSummary(firstMsg.content);
      if (summary) {
        await db.update(sessions).set({ summary }).where(eq(sessions.id, s.id));
        return { ...sessionWithParsed, summary };
      }
    }
    
    return sessionWithParsed;
  }));

  return result;
}
