// A key decision's Decisions DB row: what the Figma comment read and the
// Slack sweep both draft beside a decision's own update (#891), on one set of
// rules so the two never disagree about the log.
//
// A KEY DECISION is a build rule tied to a Roadmap card, settled or concretely
// proposed. The detector that found it says which row it belongs to, against
// the card's existing rows it was shown; this module holds it to the rules
// (`docs/connectors/notion.md` § Decisions DB):
//   • ONE ROW PER DECISION AREA. A decision that widens a row updates that
//     row — its Name, and a dated line in its body with the evidence — and
//     keeps its Owner and its primary Evidence. A row named as an existing
//     one is that row, and a decision the card already records adds nothing.
//   • SUPERSEDE. A decision that replaces a row's adds a new row whose body
//     links the older, and marks the older Superseded, with a line saying by
//     what.
//   • STATUS FOLLOWS THE STAGE: Proposed, Accepted or Rejected, exact-matched.
//     A widening moves a Proposed row on, and never moves a settled one back.
//   • OWNER IS THE PROPOSER, and a proposer the evidence never shows is a
//     guess, so the row is dropped. SIGN-OFF IS ONLY AN EVIDENCED APPROVER:
//     someone the evidence shows, other than the proposer, on an Accepted
//     decision. Whoever presses ✅ is never read here — the row is drafted
//     before anyone does.
//   • EVIDENCE is the Figma comment's link or the Slack permalink.
// A person the people maps cannot place in Notion is left off Owner or
// Sign-off rather than named by a guess.
//
// Nothing here writes: the operations are staged behind the decision's ✅.
//
// PURE.

import type { DecisionRow } from "../integrations/notion";
import type { ProposalOperation } from "../thread-state/index";

export type { DecisionRow };

/** The stages a decision is recorded at: the Decisions DB's Status options a row is drafted with. */
export const ROW_STAGES = ["Proposed", "Accepted", "Rejected"] as const;
export type RowStage = (typeof ROW_STAGES)[number];

/** The longest Name a row is drafted with. */
const MAX_NAME_CHARS = 200;

/** A key decision's row, as the detector placed it and the rules kept it. */
export interface KeyDecision {
  /** The decision area, as the row's Name. */
  name: string;
  stage: RowStage;
  /** Who proposed it, as the evidence names people. */
  proposer: string;
  /** Who the evidence shows approving it: only on an Accepted decision. */
  approvers: string[];
  relation: { kind: "new" } | { kind: "widen" | "supersede"; row: DecisionRow };
}

/**
 * The detector's `row`, held to the rules; null when it is off shape, names a
 * row it was not shown, records what a row already does, or names a proposer
 * the evidence never shows.
 *
 * @param raw - The detector's `row` object
 * @param rows - The card's rows it was shown
 * @param authors - Everyone the evidence shows, as the detector was shown them
 */
export function parseKeyDecision(raw: unknown, rows: readonly DecisionRow[], authors: readonly string[]): KeyDecision | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as Record<string, unknown>;
  const name = str(f.name);
  const stage = ROW_STAGES.find((s) => s === str(f.stage));
  const proposer = authors.find((a) => a.toLowerCase() === person(f.proposer).toLowerCase());
  if (!name || name.includes("\n") || name.length > MAX_NAME_CHARS || !stage || !proposer) return null;
  const approvers =
    stage === "Accepted"
      ? [...new Set((Array.isArray(f.approvers) ? f.approvers : []).map((a) => authors.find((x) => x.toLowerCase() === person(a).toLowerCase())))].filter(
          (a): a is string => !!a && a !== proposer,
        )
      : [];
  const kind = str(f.relation);
  const base = { name, stage, proposer, approvers };
  if (kind === "new") {
    // A row by the same name is the same area: widen it or leave it, never twin it.
    if (rows.some((r) => sameName(r.name, name))) return null;
    return { ...base, relation: { kind: "new" } };
  }
  if (kind !== "widen" && kind !== "supersede") return null;
  const row = rows.find((r) => r.id === str(f.row_id));
  if (!row || row.status === "Superseded") return null;
  if (kind === "widen" && sameName(row.name, name) && row.status === stage) return null;
  return { ...base, relation: { kind, row } };
}

/** What a decision card says its row does. */
export type RowUpdate =
  | { kind: "new"; name: string; stage: RowStage }
  | { kind: "widen"; name: string; stage: RowStage; row: { name: string; url: string } }
  | { kind: "supersede"; name: string; stage: RowStage; row: { name: string; url: string } };

/** Where the decision was said and whom the evidence names, for the row. */
export interface RowContext {
  /** The Roadmap card's page URL. */
  cardUrl: string;
  /** The Figma comment's link, or the Slack permalink. */
  evidence: string;
  /** The decision, in one sentence: the row's body. */
  decision: string;
  /** A person as the evidence names them, to their Notion user id; null when unmapped. */
  notionOf(person: string): string | null;
  /** Today, as `YYYY-MM-DD`. */
  date: string;
}

/**
 * The operations a key decision's row runs, and the line its card shows.
 *
 * @param k - A key decision, as `parseKeyDecision` kept it
 * @param ctx - The card, the evidence and the people
 */
export function draftRow(k: KeyDecision, ctx: RowContext): { operations: ProposalOperation[]; update: RowUpdate } {
  const ids = (people: readonly string[]) => [...new Set(people.map((p) => ctx.notionOf(p)).filter((id): id is string => !!id))];
  const said = `${ctx.decision} Evidence: ${ctx.evidence}`;
  const create = (extra: Array<{ heading: string; body: string }>): ProposalOperation => {
    const owner = ids([k.proposer]);
    const signOff = ids(k.approvers);
    return {
      toolName: "notion_create",
      input: {
        surface: "decision",
        title: k.name,
        properties: {
          roadmap_card: ctx.cardUrl,
          status: k.stage,
          evidence: ctx.evidence,
          ...(owner.length ? { owner } : {}),
          ...(signOff.length ? { sign_off: signOff } : {}),
        },
        sections: [{ heading: "Decision", body: ctx.decision }, { heading: "Source / Evidence", body: ctx.evidence }, ...extra],
      },
    };
  };
  const update = rowUpdateOf(k);
  if (k.relation.kind === "new") return { operations: [create([])], update };
  const row = k.relation.row;
  if (k.relation.kind === "supersede") {
    return {
      operations: [
        create([{ heading: "Supersedes", body: row.url }]),
        { toolName: "notion_update", input: { page_url: row.url, properties: { Status: "Superseded" }, append: { text: `Superseded ${ctx.date} by: ${said}` } } },
      ],
      update,
    };
  }
  const properties: Record<string, string> = {};
  if (!sameName(row.name, k.name)) properties.Name = k.name;
  // A proposal settled moves its row on; a settled row is never moved back.
  if (row.status === "Proposed" && k.stage !== "Proposed") properties.Status = k.stage;
  const signOff = ids(k.approvers).filter((id) => !row.signOff.includes(id));
  if (signOff.length) properties["Sign-off"] = [...row.signOff, ...signOff].join(", ");
  return {
    operations: [
      {
        toolName: "notion_update",
        input: { page_url: row.url, ...(Object.keys(properties).length ? { properties } : {}), append: { text: `Widened ${ctx.date}: ${said}` } },
      },
    ],
    update,
  };
}

/** What a card says a key decision's row does. */
export function rowUpdateOf(k: KeyDecision): RowUpdate {
  if (k.relation.kind === "new") return { kind: "new", name: k.name, stage: k.stage };
  return { kind: k.relation.kind, name: k.name, stage: k.stage, row: { name: k.relation.row.name, url: k.relation.row.url } };
}

/**
 * The card's rows as a detector is shown them, one per line; "none yet" when
 * the card has none.
 *
 * @param rows - The card's rows
 */
export function shownRows(rows: readonly DecisionRow[]): string[] {
  return rows.length ? rows.map((r) => `[row ${r.id}] ${r.name} · ${r.status || "no status"}`) : [];
}

/** What a row does, in plain words, for a card. */
export function rowWords(u: RowUpdate): string {
  if (u.kind === "new") return `Decisions DB: new row "${u.name}" · ${u.stage}`;
  if (u.kind === "widen") return `Decisions DB: widen "${u.row.name}" to "${u.name}" · ${u.stage}`;
  return `Decisions DB: new row "${u.name}" · ${u.stage}, superseding "${u.row.name}"`;
}

/** The detector's instructions for a key decision's row, shared by every detector that drafts one. */
export const ROW_INSTRUCTIONS = [
  "A KEY decision is a build rule tied to a listed card, settled or concretely proposed. Give it a row, against the card's listed Decisions DB rows:",
  '"row":{"name":"…","stage":"Proposed"|"Accepted"|"Rejected","proposer":"…","approvers":["…"],"relation":"new"|"widen"|"supersede"|"same","row_id":"…"}',
  "- name: the decision area, one line. One row per area: a decision that adds to a listed row's area widens it (row_id, and name: the area as widened); one that replaces a listed row's decision supersedes it (row_id); one a listed row already records is same (row_id); otherwise new.",
  "- stage: Proposed until someone other than the proposer agrees; Accepted once they do; Rejected when it was turned down.",
  "- proposer: who proposed it, exactly as listed beside their words. approvers: only people whose own words approve it.",
  "- Leave row out for a decision that is not key.",
].join("\n");

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** A person as the detector names them: a Slack mention or an `@handle` is its bare name. */
function person(v: unknown): string {
  return str(v).replace(/^<@([^>|]+)(?:\|[^>]*)?>$/, "$1").replace(/^@/, "");
}
