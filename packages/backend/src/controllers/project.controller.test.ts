import { test, expect, describe, beforeAll, afterEach } from "bun:test";
import { db, initDb } from "../db";
import { projects, sessions } from "../db/schema";
import { getTokenStats, getOverviewStats } from "./project.controller";

describe("Project Controller - Token and Cost Analytics", () => {
  beforeAll(async () => {
    await initDb();
  });

  afterEach(async () => {
    await db.delete(sessions);
    await db.delete(projects);
  });

  test("getTokenStats aggregates base and reasoning tokens and estimated cost", async () => {
    const p1 = "p1";
    await db.insert(projects).values({
      id: p1,
      name: "Synapse Core",
      path: "/repo/synapse",
      lastUpdated: new Date()
    });

    await db.insert(sessions).values([
      {
        id: "s1",
        projectId: p1,
        source: "gemini",
        startTime: new Date(),
        lastUpdated: new Date(),
        totalTokens: JSON.stringify({ base: 1000, reasoning: 300 }),
        estimatedCost: 0.0022
      },
      {
        id: "s2",
        projectId: p1,
        source: "copilot",
        startTime: new Date(),
        lastUpdated: new Date(),
        totalTokens: JSON.stringify({ base: 500, reasoning: 0 }),
        estimatedCost: null
      }
    ]);

    const stats = await getTokenStats();

    expect(stats).toHaveLength(1);
    expect(stats[0]!.name).toBe("Synapse Core");
    expect(stats[0]!.baseTokens).toBe(1500);
    expect(stats[0]!.reasoningTokens).toBe(300);
    expect(stats[0]!.tokens).toBe(1800);
    expect(stats[0]!.estimatedCost).toBeCloseTo(0.0022, 4);
  });

  test("getOverviewStats aggregates global token taxonomy and scoped costs", async () => {
    const p1 = "p1";
    await db.insert(projects).values({
      id: p1,
      name: "Synapse Core",
      path: "/repo/synapse",
      lastUpdated: new Date()
    });

    await db.insert(sessions).values([
      {
        id: "s1",
        projectId: p1,
        source: "gemini",
        startTime: new Date(),
        lastUpdated: new Date(),
        totalTokens: JSON.stringify({ base: 2000, reasoning: 500 }),
        estimatedCost: 0.0045
      },
      {
        id: "s2",
        projectId: p1,
        source: "copilot",
        startTime: new Date(),
        lastUpdated: new Date(),
        totalTokens: JSON.stringify({ base: 800 }),
        estimatedCost: null
      }
    ]);

    const overview = await getOverviewStats();

    expect(overview.totalSessions).toBe(2);
    expect(overview.baseTokens).toBe(2800);
    expect(overview.reasoningTokens).toBe(500);
    expect(overview.totalTokens).toBe(3300);
    expect(overview.totalEstimatedCost).toBeCloseTo(0.0045, 4);
    expect(overview.activeAgents).toContain("gemini");
    expect(overview.activeAgents).toContain("copilot");
    expect(overview.costSupportedAgents).toContain("gemini");
    expect(overview.costSupportedAgents).not.toContain("copilot");
  });
});
