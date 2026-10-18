/**
 * Insight Tracker (Gadget-style card store) — yctour-office INSIGHTS D1.
 * Seeded from ideas/insight-cards; mutated from the /insights UI.
 */

import type { InsightCard, InsightCardInput, InsightStatus } from "@gadgets/workshop-shared/api";

type InsightsEnv = { INSIGHTS?: D1Database };

type Row = {
  card_id: string;
  title: string;
  status: string;
  priority: string;
  body: string;
  tags: string;
  sources: string;
  created: string;
  updated: string;
};

const STATUSES: InsightStatus[] = ["신규", "검증중", "채택", "보류"];

function requireDb(env: InsightsEnv): D1Database {
  if (!env.INSIGHTS) throw new Error("INSIGHTS D1 binding is not configured");
  return env.INSIGHTS;
}

function rowToCard(row: Row): InsightCard {
  let tags: string[] = [];
  let sources: InsightCard["sources"] = [];
  try {
    tags = JSON.parse(row.tags) as string[];
    if (!Array.isArray(tags)) tags = [];
  } catch {
    tags = [];
  }
  try {
    sources = JSON.parse(row.sources) as InsightCard["sources"];
    if (!Array.isArray(sources)) sources = [];
  } catch {
    sources = [];
  }
  return {
    cardId: row.card_id,
    title: row.title,
    status: row.status as InsightStatus,
    priority: row.priority as InsightCard["priority"],
    body: row.body,
    tags,
    sources,
    created: row.created,
    updated: row.updated,
  };
}

function nextCardId(existing: string[]): string {
  let max = 0;
  for (const id of existing) {
    const n = Number.parseInt(id.replace(/^INS-/, ""), 10);
    if (Number.isInteger(n) && n > max) max = n;
  }
  return `INS-${String(max + 1).padStart(3, "0")}`;
}

export async function listInsightCards(env: InsightsEnv, status?: InsightStatus): Promise<InsightCard[]> {
  const db = requireDb(env);
  const result = status
    ? await db
        .prepare(
          `SELECT * FROM insight_cards WHERE status = ?
           ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, updated_at DESC`,
        )
        .bind(status)
        .all<Row>()
    : await db
        .prepare(
          `SELECT * FROM insight_cards
           ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, updated_at DESC`,
        )
        .all<Row>();
  return (result.results ?? []).map(rowToCard);
}

export async function getInsightCard(env: InsightsEnv, cardId: string): Promise<InsightCard | null> {
  const db = requireDb(env);
  const row = await db.prepare(`SELECT * FROM insight_cards WHERE card_id = ?`).bind(cardId).first<Row>();
  return row ? rowToCard(row) : null;
}

export async function createInsightCard(env: InsightsEnv, input: InsightCardInput): Promise<InsightCard> {
  const db = requireDb(env);
  const title = String(input.title ?? "").trim();
  if (!title) throw new Error("title is required");
  const status: InsightStatus = input.status && STATUSES.includes(input.status) ? input.status : "신규";
  const priority =
    input.priority === "high" || input.priority === "low" || input.priority === "medium"
      ? input.priority
      : "medium";
  const body = String(input.body ?? "");
  const tags = Array.isArray(input.tags) ? input.tags.map(String).slice(0, 32) : [];
  const sources = Array.isArray(input.sources) ? input.sources.slice(0, 32) : [];
  const today = new Date().toISOString().slice(0, 10);

  const all = await db.prepare(`SELECT card_id FROM insight_cards`).all<{ card_id: string }>();
  const cardId = nextCardId((all.results ?? []).map((r) => r.card_id));

  await db
    .prepare(
      `INSERT INTO insight_cards (card_id, title, status, priority, body, tags, sources, created, updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      cardId,
      title,
      status,
      priority,
      body,
      JSON.stringify(tags),
      JSON.stringify(sources),
      today,
      today,
    )
    .run();

  return (await getInsightCard(env, cardId))!;
}

export async function setInsightCardStatus(
  env: InsightsEnv,
  cardId: string,
  status: InsightStatus,
): Promise<InsightCard | null> {
  if (!STATUSES.includes(status)) throw new Error("invalid status");
  const db = requireDb(env);
  const today = new Date().toISOString().slice(0, 10);
  await db
    .prepare(`UPDATE insight_cards SET status = ?, updated = ?, updated_at = datetime('now') WHERE card_id = ?`)
    .bind(status, today, cardId)
    .run();
  return getInsightCard(env, cardId);
}
