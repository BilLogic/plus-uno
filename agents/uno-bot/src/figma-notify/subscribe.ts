// uno-bot's Figma notification subscriptions: listed, created where missing,
// and checked (#895).
//
// SAFE TO RE-RUN, by construction. Each team's subscriptions are read first; a
// subscription counts as there when one has the same event and points at this
// Worker's route, whatever its status. Only a missing one is created, and only
// when the run says `create`. Nothing is deleted or changed, and a
// subscription pointing anywhere else is listed as someone else's and left
// alone.
//
// ONE STEP, THEN THE REST, as #884 settled. #895's run created FILE_COMMENT on
// Universal alone, and its PING was checked in `status`. The rest — both
// events on all six teams, 12 in all (#896) — are one run of the defaults. A
// creation that fails stops the run there, so setup cannot half-break across
// teams. A new subscription is created ACTIVE, so that Figma sends the PING.
//
// WHAT IS PRINTED. Team names, events, webhook ids, statuses, and for each
// delivery its time, event type, Figma's answer and any error. Never a
// delivery's payload — it carries the passcode and a comment's text — and
// never the passcode, which this module only hands to `createWebhook`.
//
// PURE: the Figma client arrives by name, so the in-memory Figma tests it.

import type { FigmaClient, FigmaWebhookEvent } from "../figma/client";
import type { FigmaTeam } from "./teams";

/** What a created subscription is called in Figma: the label's short form. */
export const WEBHOOK_DESCRIPTION = "🐐 le goat (uno-bot) · Figma notifications";
/** Figma's limit on a passcode. */
export const MAX_PASSCODE_CHARS = 100;
/** Figma's limit on a team's subscriptions. */
export const MAX_WEBHOOKS_PER_TEAM = 20;
/** The notifications uno-bot subscribes to (#884): comments and file changes. */
export const SUBSCRIBABLE: readonly FigmaWebhookEvent[] = ["FILE_COMMENT", "FILE_UPDATE"];

export interface SubscriptionRow {
  team: string;
  event: FigmaWebhookEvent;
  /** `exists` and `missing` on a read; `created`, `refused` or `failed` when
   *  the run created. */
  state: "exists" | "missing" | "created" | "refused" | "failed";
  webhookId?: string;
  status?: "ACTIVE" | "PAUSED";
  detail?: string;
}

/** A subscription on one of the teams that points somewhere other than here. */
export interface ForeignWebhook {
  team: string;
  webhookId: string;
  event: string;
  endpoint: string;
}

export interface SubscriptionReport {
  rows: SubscriptionRow[];
  foreign: ForeignWebhook[];
  /** The run stopped at a refusal or a failure; the rows after it were not tried. */
  stopped: boolean;
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Read each team's subscriptions, and create the missing ones when asked.
 *
 * @param input - The client, the teams and events, this Worker's route, the
 *   passcode (needed to create only), and whether to create
 * @throws Before anything is read, when `create` has no usable passcode
 */
export async function ensureSubscriptions(input: {
  figma: Pick<FigmaClient, "teamWebhooks" | "createWebhook">;
  teams: readonly FigmaTeam[];
  events: readonly FigmaWebhookEvent[];
  endpoint: string;
  passcode?: string | undefined;
  create: boolean;
}): Promise<SubscriptionReport> {
  const { figma, teams, events, endpoint, passcode, create } = input;
  if (create && !passcode) throw new Error("FIGMA_WEBHOOK_PASSCODE is not set, so nothing can be created");
  if (create && passcode!.length > MAX_PASSCODE_CHARS) {
    throw new Error(`FIGMA_WEBHOOK_PASSCODE is longer than Figma's ${MAX_PASSCODE_CHARS} characters`);
  }

  const report: SubscriptionReport = { rows: [], foreign: [], stopped: false };
  for (const team of teams) {
    let webhooks;
    try {
      ({ webhooks } = await figma.teamWebhooks(team.id));
    } catch (err) {
      for (const event of events) report.rows.push({ team: team.name, event, state: "failed", detail: messageOf(err) });
      report.stopped = true;
      return report;
    }
    for (const w of webhooks) {
      if (w.endpoint !== endpoint) report.foreign.push({ team: team.name, webhookId: w.id, event: w.event_type, endpoint: w.endpoint });
    }
    let count = webhooks.length;
    for (const event of events) {
      const mine = webhooks.find((w) => w.event_type === event && w.endpoint === endpoint);
      if (mine) {
        report.rows.push({ team: team.name, event, state: "exists", webhookId: mine.id, status: mine.status });
        continue;
      }
      if (!create) {
        report.rows.push({ team: team.name, event, state: "missing" });
        continue;
      }
      if (count >= MAX_WEBHOOKS_PER_TEAM) {
        report.rows.push({
          team: team.name,
          event,
          state: "refused",
          detail: `the team already has ${count} subscriptions, Figma's limit`,
        });
        report.stopped = true;
        return report;
      }
      try {
        const made = await figma.createWebhook({
          event_type: event,
          context: "team",
          context_id: team.id,
          endpoint,
          passcode: passcode!,
          status: "ACTIVE",
          description: WEBHOOK_DESCRIPTION,
        });
        count += 1;
        report.rows.push({ team: team.name, event, state: "created", webhookId: made.id, status: made.status });
      } catch (err) {
        report.rows.push({ team: team.name, event, state: "failed", detail: messageOf(err) });
        report.stopped = true;
        return report;
      }
    }
  }
  return report;
}

/** One delivery, as `status` prints it. */
export interface Delivery {
  sentAt: string;
  /** The payload's `event_type` — the one field read from it. */
  type: string;
  /** Figma's record of how the route answered: "200", "401", or "no answer". */
  answered: string;
  error?: string;
}

export interface SubscriptionStatus {
  team: string;
  event: string;
  webhookId: string;
  status: string;
  deliveries: Delivery[];
  /** The history could not be read. */
  detail?: string;
}

/**
 * The newest deliveries to each of this Worker's subscriptions on the teams —
 * how the PING and the first live comment are seen to have arrived.
 *
 * @param input - The client, the teams, this Worker's route, and how many
 *   deliveries per subscription
 */
export async function subscriptionStatus(input: {
  figma: Pick<FigmaClient, "teamWebhooks" | "webhookRequests">;
  teams: readonly FigmaTeam[];
  endpoint: string;
  limit?: number;
}): Promise<SubscriptionStatus[]> {
  const limit = input.limit ?? 5;
  const out: SubscriptionStatus[] = [];
  for (const team of input.teams) {
    const { webhooks } = await input.figma.teamWebhooks(team.id);
    for (const w of webhooks.filter((hook) => hook.endpoint === input.endpoint)) {
      const row: SubscriptionStatus = { team: team.name, event: w.event_type, webhookId: w.id, status: w.status, deliveries: [] };
      try {
        const { requests } = await input.figma.webhookRequests(w.id);
        row.deliveries = [...requests]
          .sort((a, b) => Date.parse(b.request_info.sent_at) - Date.parse(a.request_info.sent_at))
          .slice(0, limit)
          .map((r) => ({
            sentAt: r.request_info.sent_at,
            type: typeof r.request_info.payload?.event_type === "string" ? r.request_info.payload.event_type : "?",
            answered: r.response_info ? String(r.response_info.status) : "no answer",
            ...(r.error_msg ? { error: r.error_msg } : {}),
          }));
      } catch (err) {
        row.detail = messageOf(err);
      }
      out.push(row);
    }
  }
  return out;
}

/** A report, as lines for a log or a job summary. */
export function reportLines(report: SubscriptionReport, endpoint: string): string[] {
  const lines = [`Subscriptions to ${endpoint}:`];
  for (const r of report.rows) {
    const id = r.webhookId ? ` (webhook ${r.webhookId}${r.status ? `, ${r.status}` : ""})` : "";
    lines.push(`  ${r.team} ${r.event}: ${r.state}${id}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  if (report.stopped) lines.push("  Stopped there: nothing after it was tried.");
  for (const f of report.foreign) {
    lines.push(`  ${f.team} also has ${f.event} webhook ${f.webhookId} pointing at ${f.endpoint}, left as it is.`);
  }
  return lines;
}

/** Each subscription's newest deliveries, as lines. */
export function statusLines(status: readonly SubscriptionStatus[], endpoint: string): string[] {
  if (!status.length) return [`No subscription points at ${endpoint} on these teams.`];
  const lines: string[] = [];
  for (const s of status) {
    lines.push(`${s.team} ${s.event} (webhook ${s.webhookId}, ${s.status}):`);
    if (s.detail) lines.push(`  history unreadable — ${s.detail}`);
    else if (!s.deliveries.length) lines.push("  no deliveries in the last seven days");
    for (const d of s.deliveries) lines.push(`  ${d.sentAt} ${d.type} → ${d.answered}${d.error ? ` (${d.error})` : ""}`);
  }
  return lines;
}
