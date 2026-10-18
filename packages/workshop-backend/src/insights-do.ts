/**
 * Insight Tracker Durable Object — live card store with subscriber broadcast.
 * Cloudflare DO is the co-editing authority; D1 stays as the durable export/seed.
 */

import { DurableObject } from "cloudflare:workers";
import { RpcStub } from "capnweb";
import type {
  InsightCard,
  InsightCardInput,
  InsightStatus,
  InsightSubscriber,
} from "@gadgets/workshop-shared/api";

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

function rowToCard(row: Row): InsightCard {
  const parse = <T>(s: string, fallback: T): T => {
    try {
      const v = JSON.parse(s) as T;
      return v ?? fallback;
    } catch {
      return fallback;
    }
  };
  return {
    cardId: row.card_id,
    title: row.title,
    status: row.status as InsightStatus,
    priority: row.priority as InsightCard["priority"],
    body: row.body,
    tags: parse<string[]>(row.tags, []),
    sources: parse<InsightCard["sources"]>(row.sources, []),
    created: row.created,
    updated: row.updated,
  };
}

/**
 * Deployment-wide Insight Tracker. One instance (`getByName("insights")`).
 * Mutations write DO storage, mirror to D1, and notify all subscribers.
 */
export class InsightTrackerDurableObject extends DurableObject<Cloudflare.Env> {
  #subscribers = new Map<string, RpcStub<InsightSubscriber>>();
  #seq = 0;
  #seeded = false;

  #ensureSeeded(): void {
    if (this.#seeded) return;
    this.#seeded = true;
    const count = this.ctx.storage.sql
      .exec<{ n: number }>(`SELECT COUNT(*) AS n FROM insight_cards`)
      .toArray();
    if ((count[0]?.n ?? 0) > 0) return;
    if (!this.env.INSIGHTS) return;
    // Async seed from D1 — fire and forget; list() will wait via #seedPromise if needed.
    this.#seedPromise = this.env.INSIGHTS.prepare(
      `SELECT card_id, title, status, priority, body, tags, sources, created, updated FROM insight_cards`,
    )
      .all<Row>()
      .then((res) => {
        for (const row of res.results ?? []) {
          this.ctx.storage.sql.exec(
            `INSERT OR IGNORE INTO insight_cards (card_id, title, status, priority, body, tags, sources, created, updated)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            row.card_id,
            row.title,
            row.status,
            row.priority,
            row.body,
            row.tags,
            row.sources,
            row.created,
            row.updated,
          );
        }
      })
      .catch(() => {
        /* seed optional */
      });
  }

  #seedPromise: Promise<void> = Promise.resolve();

  async #allCards(): Promise<InsightCard[]> {
    this.#ensureSeeded();
    await this.#seedPromise;
    const result = this.ctx.storage.sql
      .exec<Row>(
        `SELECT card_id, title, status, priority, body, tags, sources, created, updated
         FROM insight_cards
         ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, updated_at DESC`,
      )
      .toArray();
    return result.map(rowToCard);
  }

  async #broadcast(): Promise<void> {
    const cards = await this.#allCards();
    for (const [key, sub] of [...this.#subscribers]) {
      try {
        await sub.onInsightCardsChanged(cards);
      } catch {
        this.#subscribers.delete(key);
        try {
          sub[Symbol.dispose]();
        } catch {
          /* ignore */
        }
      }
    }
  }

  async #mirrorToD1(card: InsightCard): Promise<void> {
    if (!this.env.INSIGHTS) return;
    await this.env.INSIGHTS.prepare(
      `INSERT INTO insight_cards (card_id, title, status, priority, body, tags, sources, created, updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(card_id) DO UPDATE SET
         title=excluded.title, status=excluded.status, priority=excluded.priority,
         body=excluded.body, tags=excluded.tags, sources=excluded.sources,
         updated=excluded.updated, updated_at=datetime('now')`,
    )
      .bind(
        card.cardId,
        card.title,
        card.status,
        card.priority,
        card.body,
        JSON.stringify(card.tags),
        JSON.stringify(card.sources),
        card.created,
        card.updated,
      )
      .run();
  }

  removeSubscriber(key: string): void {
    this.#subscribers.delete(key);
  }

  async listInsightCards(status?: InsightStatus): Promise<InsightCard[]> {
    const cards = await this.#allCards();
    return status ? cards.filter((c) => c.status === status) : cards;
  }

  async getInsightCard(cardId: string): Promise<InsightCard | null> {
    const cards = await this.#allCards();
    return cards.find((c) => c.cardId === cardId) ?? null;
  }

  async createInsightCard(input: InsightCardInput): Promise<InsightCard> {
    await this.#allCards();
    const title = String(input.title ?? "").trim();
    if (!title) throw new Error("title is required");
    const status: InsightStatus =
      input.status && STATUSES.includes(input.status) ? input.status : "신규";
    const priority =
      input.priority === "high" || input.priority === "low" || input.priority === "medium"
        ? input.priority
        : "medium";
    const body = String(input.body ?? "");
    const tags = Array.isArray(input.tags) ? input.tags.map(String).slice(0, 32) : [];
    const sources = Array.isArray(input.sources) ? input.sources.slice(0, 32) : [];
    const today = new Date().toISOString().slice(0, 10);

    const existing = this.ctx.storage.sql
      .exec<{ card_id: string }>(`SELECT card_id FROM insight_cards`)
      .toArray();
    let max = 0;
    for (const r of existing) {
      const n = Number.parseInt(r.card_id.replace(/^INS-/, ""), 10);
      if (Number.isInteger(n) && n > max) max = n;
    }
    const cardId = `INS-${String(max + 1).padStart(3, "0")}`;

    this.ctx.storage.sql.exec(
      `INSERT INTO insight_cards (card_id, title, status, priority, body, tags, sources, created, updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      cardId,
      title,
      status,
      priority,
      body,
      JSON.stringify(tags),
      JSON.stringify(sources),
      today,
      today,
    );

    const card = (await this.getInsightCard(cardId))!;
    await this.#mirrorToD1(card);
    await this.#broadcast();
    return card;
  }

  async setInsightCardStatus(cardId: string, status: InsightStatus): Promise<InsightCard | null> {
    if (!STATUSES.includes(status)) throw new Error("invalid status");
    await this.#allCards();
    const today = new Date().toISOString().slice(0, 10);
    this.ctx.storage.sql.exec(
      `UPDATE insight_cards SET status = ?, updated = ?, updated_at = datetime('now') WHERE card_id = ?`,
      status,
      today,
      cardId,
    );
    const card = await this.getInsightCard(cardId);
    if (card) {
      await this.#mirrorToD1(card);
      await this.#broadcast();
    }
    return card;
  }

/** Live list updates. `onInsightCardsChanged` is invoked immediately with the current list. */
  async subscribeInsightCards(
    subscriber: RpcStub<InsightSubscriber>,
  ): Promise<RpcStub<{}>> {
    subscriber = subscriber.dup();
    const key = `ins-${++this.#seq}`;
    this.#subscribers.set(key, subscriber);
    const cards = await this.#allCards();
    await subscriber.onInsightCardsChanged(cards);
    const store = this;
    return new RpcStub<{}>({
      [Symbol.dispose]() {
        store.removeSubscriber(key);
        subscriber[Symbol.dispose]();
      },
    });
  }
}
