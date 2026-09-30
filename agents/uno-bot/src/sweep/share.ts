// What leaves a group DM once someone in it ✅s a sweep card there.
//
// Anything found in a group DM stays in it. The one thing that leaves is a
// reworded note, and only after a ✅ from someone in the group DM: the card
// says so before anyone confirms it (`sweepCard`). The note names each Notion
// page the ✅ actually brought up to date and says that a group conversation
// settled it. It carries no quote of the conversation or of the change, no
// name or mention, and no link back into the group DM. It goes to the rung the
// finding would take with its evidence set aside (`shareDestination`, and
// `sweepShareOf` in `./cards.ts`, which is what the card carries):
// #plus-universal for the design system, #plus-design otherwise.
//
// A private channel's card has no share: what is found there stays there.
//
// PURE: no `Env`, no Slack call. `./env.ts` posts what this returns.

import type { OperationOutcome } from "../gate/index";
import type { SweepShare } from "../thread-state/index";
import { SWEEP_CARD_MARK } from "./cards";

/** One note, and the team channel it goes to, by role. */
export interface SweepShareNote {
  to: SweepShare["pages"][number]["to"];
  text: string;
}

/**
 * The notes a ✅ on a group-DM card posts: one per team channel, naming the
 * pages whose fix came back ok. Nothing applied, nothing shared.
 *
 * @param share - The card's `sweepShare`
 * @param outcomes - What its batch ran
 */
export function sweepShareNotes(share: SweepShare, outcomes: readonly OperationOutcome[]): SweepShareNote[] {
  const applied = new Set(
    outcomes
      .filter((o) => o.ok && o.toolName === "notion_update" && typeof o.input?.page_url === "string")
      .map((o) => o.input!.page_url as string),
  );
  const notes: SweepShareNote[] = [];
  for (const to of ["plus-design", "plus-universal"] as const) {
    const pages = share.pages.filter((p) => p.to === to && applied.has(p.url));
    if (!pages.length) continue;
    const links = pages.map((p) => `<${p.url}|${plain(p.title)}>`);
    const text =
      pages.length === 1
        ? `:mag: *${SWEEP_CARD_MARK}* — a group conversation settled something ${links[0]} still said the old way, and the page is now up to date.`
        : `:mag: *${SWEEP_CARD_MARK}* — a group conversation settled things these pages still said the old way, and they are now up to date:\n${links.map((l) => `• ${l}`).join("\n")}`;
    notes.push({ to, text });
  }
  return notes;
}

/** A page title as link text: Slack's link markup characters removed. */
function plain(title: string): string {
  return title.replace(/[<>|]/g, " ").replace(/\s+/g, " ").trim() || "a Notion page";
}
