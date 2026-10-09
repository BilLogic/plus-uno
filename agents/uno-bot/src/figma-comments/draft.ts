// What a Figma comment decision becomes: the one operation its ✅ runs, and
// the line its card shows (#900).
//
//   prd change    → `notion_update` `replace` on the PRD block that states the
//                   old rule, stamped with the edit time the read saw (ADR-029):
//                   a block that moved since is refused, unwritten.
//   prd add       → `notion_update` `insert` after the section's last block,
//                   stamped the same way.
//   card          → `notion_update` `properties` on the card. The tool matches
//                   the field to the Roadmap's live schema and reports a value
//                   that is not an option rather than creating it.
//   design-system → `github_issue_create`. The tool adds the `harness-intake`
//                   labels and its footer. A file in the six teams counts like
//                   a public design channel (ADR-031), so the body may carry the
//                   decision and a short quote; any `@handle` in it is set in
//                   code, so the issue pings no GitHub user.
//
// Nothing here writes: the operation is staged behind the card's ✅.
//
// PURE.

import { githubInert } from "../figma-drift/draft";
import type { ProposalOperation } from "../thread-state/index";
import type { SweepSource } from "../sweep/finding";
import type { DetectedDecision } from "./detector";

/** What a card's update line says. */
export type DecisionUpdate =
  | { kind: "prd"; change: "add" | "change"; section: string | null; page: { title: string; url: string } }
  | { kind: "card"; card: number; field: string; from: string | null; to: string; url: string }
  | { kind: "intake"; title: string };

/** Where the decision was said, for the intake's body. */
export interface DraftContext {
  prd: SweepSource | null;
  file: { title: string };
  /** The comment's own link in Figma. */
  commentUrl: string;
  /** The short quote the card shows, and who said it. */
  quote: string;
  by: string;
  /** "Specs › Goal states", where the thread is pinned. */
  where: string;
}

/**
 * The operation a decision's ✅ runs, and what its card says it does.
 *
 * @param d - A validated decision
 * @param ctx - The page it writes to, and where it was said
 */
export function draftDecision(d: DetectedDecision, ctx: DraftContext): { operation: ProposalOperation; update: DecisionUpdate } {
  if (d.route === "prd" && d.prd && ctx.prd) {
    const page = { title: ctx.prd.title, url: ctx.prd.url };
    if (d.prd.kind === "change") {
      return {
        operation: {
          toolName: "notion_update",
          input: {
            page_url: ctx.prd.url,
            replace: [{ block_id: d.prd.block.id, last_edited_time: d.prd.block.lastEditedTime, content: d.prd.replacement }],
          },
        },
        update: { kind: "prd", change: "change", section: d.prd.section, page },
      };
    }
    return {
      operation: {
        toolName: "notion_update",
        input: {
          page_url: ctx.prd.url,
          insert: [{ after_block_id: d.prd.anchorId, last_edited_time: d.prd.anchorEditedTime, content: d.prd.text }],
        },
      },
      update: { kind: "prd", change: "add", section: d.prd.section, page },
    };
  }
  if (d.route === "card" && d.card) {
    const { card, field, from, to } = d.card;
    return {
      operation: { toolName: "notion_update", input: { page_url: card.url, properties: { [field]: to } } },
      update: { kind: "card", card: card.number, field, from, to, url: card.url },
    };
  }
  const intake = d.intake ?? { title: d.decision, body: d.decision };
  const body = [
    githubInert(intake.body),
    "",
    `Decided in a Figma comment on [${ctx.file.title}](${ctx.commentUrl}) (${ctx.where}):`,
    `> ${githubInert(ctx.quote)}`,
    `— ${githubInert(ctx.by)}`,
  ].join("\n");
  return {
    operation: { toolName: "github_issue_create", input: { title: githubInert(intake.title), body } },
    update: { kind: "intake", title: intake.title },
  };
}

/** A Figma link that opens a node, in Figma's dash form. */
export function nodeUrl(fileKey: string, nodeId: string): string {
  return `https://www.figma.com/design/${encodeURIComponent(fileKey)}?node-id=${encodeURIComponent(nodeId.replace(":", "-"))}`;
}

/** A Figma link that opens a comment on its node. */
export function commentUrl(fileKey: string, nodeId: string, commentId: string): string {
  return `${nodeUrl(fileKey, nodeId)}#${encodeURIComponent(commentId)}`;
}
