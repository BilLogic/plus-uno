// A Team Members gap, told to the lead at the moment it costs something.
//
// A missing id on a Team Members row matters only when it blocks something,
// so there is no standing list of gaps. Two places say so as it happens:
//   • a Figma @uno ask from a commenter the Figma people map does not know,
//     whose Figma handle is the name of a row with no readable Figma User ID —
//     they got a public-only answer (`../figma-ask/job.ts`);
//   • a card follow-up that posted without tagging someone it named
//     (`../follow-through/run.ts`).
// Each sends one DM to `LEAD_USER_ID` alone: the person's name and the one
// column to fill on their row, and no id, file or quote. A person is noted
// once in 30 days, by a mark in KV; unset `LEAD_USER_ID` notes nobody.
//
// A note is a side remark, so it never fails what it rides on: every error,
// a budget stop included, is logged and swallowed. Free of `Env`:
// `./production.ts` binds the read, the marks, the lead and the DM.

import { escapeSlackText } from "../slack/mrkdwn";
import { normalisePersonName } from "./roles";
import type { StoredTeamRoles } from "./team-roles-sync";

/** How long a person, once noted, is not noted again. */
export const GAP_NOTE_TTL_S = 30 * 24 * 60 * 60;

/** The Team Members column a note asks the lead to fill. */
export type GapColumn = "Figma User ID" | "Slack ID" | "Notion Person";

/** What the notes read and where they go. */
export interface GapNoteDeps {
  /** `LEAD_USER_ID`: the one person noted, or null when unset. */
  lead: string | null;
  /** The stored team map, or null when there is none. */
  read(): Promise<StoredTeamRoles | null>;
  /** The 30-day marks, by key. */
  marks: {
    has(key: string): Promise<boolean>;
    put(key: string, ttlS: number): Promise<void>;
  };
  /** A DM to one person. */
  dm(userId: string, text: string): Promise<{ ok: boolean; error?: string }>;
}

/** The two moments a gap is noted. Neither throws. */
export interface GapNotes {
  /** A Figma asker the people map does not know, by their Figma handle. */
  figmaAsker(handle: string): Promise<void>;
  /** People a card follow-up could not tag, by the names the card gave. */
  untagged(names: readonly string[]): Promise<void>;
}

/** The KV key a person's mark is kept under. */
export function gapNoteKey(name: string): string {
  return `gap-note:${normalisePersonName(name)}`;
}

const WHY: Record<"figma" | "follow-up", string> = {
  figma: "their @uno asks in Figma get public-only answers until it is filled",
  "follow-up": "card follow-ups cannot tag them until it is filled",
};

/** A note's words: the person, the column, and what the gap costs. */
export function gapNoteText(name: string, column: GapColumn, why: keyof typeof WHY): string {
  return `${escapeSlackText(name.replace(/\s+/g, " ").trim())}'s Team Members row needs a *${column}*: ${WHY[why]}.`;
}

/** The row name a list holds for `name`, compared as `matchRoster` compares names. */
function rowNamed(name: string, rows: readonly string[] | undefined): string | null {
  const key = normalisePersonName(name);
  return key ? (rows ?? []).find((r) => normalisePersonName(r) === key) ?? null : null;
}

/**
 * The notes, over their dependencies.
 *
 * @param deps - The lead, the stored map, the marks and the DM
 */
export function gapNotes(deps: GapNoteDeps): GapNotes {
  async function note(name: string, column: GapColumn, why: keyof typeof WHY): Promise<void> {
    const key = gapNoteKey(name);
    if (await deps.marks.has(key)) return;
    const res = await deps.dm(deps.lead!, gapNoteText(name, column, why));
    if (!res.ok) {
      console.warn(`[gap-notes] note to the lead failed: ${res.error ?? "unknown error"}`);
      return;
    }
    await deps.marks.put(key, GAP_NOTE_TTL_S);
  }
  async function safely(what: string, run: () => Promise<void>): Promise<void> {
    if (!deps.lead) return;
    try {
      await run();
    } catch (err) {
      console.warn(`[gap-notes] ${what} not noted: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return {
    figmaAsker: (handle) =>
      safely("a Figma asker", async () => {
        const stored = await deps.read();
        const row = stored ? rowNamed(handle, stored.noFigmaId) : null;
        if (row) await note(row, "Figma User ID", "figma");
      }),
    untagged: (names) =>
      safely("an untagged person", async () => {
        if (!names.some((n) => n.trim())) return;
        const stored = await deps.read();
        for (const name of names) {
          if (!name.trim()) continue;
          // A row no single Slack member matched needs its Slack ID; any
          // other is tagged through its Notion Person.
          const unmatched = rowNamed(name, stored?.gaps);
          await note(unmatched ?? name, unmatched ? "Slack ID" : "Notion Person", "follow-up");
        }
      }),
  };
}
