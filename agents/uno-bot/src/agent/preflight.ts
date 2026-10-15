// Clarify-vs-act calibration (D3).
//
// Before the Worker stages a side-effect proposal, run a pre-flight check: does
// the tool call carry enough information to be actionable? If not, return an
// `ask` string — the Worker posts it and gathers the missing piece INSTEAD of
// proposing. This keeps the "intentional friction" out of the model's hands:
// gating never depends on Claude remembering to ask. When everything needed is
// present, return null and the proposal proceeds (act when sufficient).
//
// The one seam beside the tool table that keeps a switch on tool names, and it
// keeps it on purpose (#598): each arm is a SUBSTANCE check — is this PRD
// filled in, is that recipient resolved — not a restatement of which tools are gated, which is the table's
// `access` column. A tool with no arm here is a tool with nothing to check,
// which `default` already says, so a new row needs no edit in this file.

import type { Env, SlackContext } from "../types";
import { decideShareoutPlace, type ShareoutReads } from "../tools/share-for-feedback";
// Placeholder detection lives next door, import-free, so the loop and a plain
// Node test can both reach it without dragging `Env` behind them.
import { placeholderRefusal } from "./placeholder";
import { relayRecipientId } from "../tools/relayed-dm-render";
import { resolveRepoFor } from "../integrations/github";
import { issueUpdateFromInput } from "../tools/github-issue-update-render";
import { checkWorkflowRun } from "../tools/github-workflow-render";
import { budgetHeadroom } from "../net";
import { MARKETPLACE_CHECK_COST, marketplaceInputOf, marketplaceQuestion } from "../integrations/notion-marketplace";

export interface PreflightCtx {
  env: Env;
  /** Where a share-out was asked and by whom, and Slack as the bot sees it —
   *  for the checks on a channel the asker names. Absent, those checks wait
   *  for the executor, which runs them at ✅. */
  shareout?: {
    slack: Pick<SlackContext, "channel" | "threadTs" | "replyTs" | "requestedBy">;
    reads: ShareoutReads;
  };
}

export interface PreflightAsk {
  ask: string;
}

// ---- cheap, null-safe helpers (inputs are Record<string, unknown>) ----

// `collectStrings` moved to `agent/tool-input.ts` — import-free, so the
// proposal-card path in Turn can read a tool payload without dragging `Env` and
// the design-system component list behind it. Re-exported here because callers
// (slack/proposal-render.ts, the share-out bundle audit) reach for it here.
export { collectStrings } from "./tool-input";

export async function preflight(
  toolName: string,
  input: Record<string, unknown>,
  ctx: PreflightCtx,
): Promise<PreflightAsk | null> {
  switch (toolName) {
    case "notion_create": {
      // Only PRD-shaped surfaces need the substance check — an intake or a
      // decision can legitimately be short.
      const surface = typeof input.surface === "string" ? input.surface.trim().toLowerCase() : "";
      const title = typeof input.title === "string" ? input.title.trim() : "";
      const summary = typeof input.summary === "string" ? input.summary.trim() : "";
      if (surface === "prd" && (!title || summary.length < 30)) {
        return {
          ask:
            "That PRD is a little thin to file. Give me a clear *title* and a couple of sentences of *summary* (what it is + why), and I'll draft the card.",
        };
      }
      if (surface === "decision") {
        const props =
          input.properties && typeof input.properties === "object"
            ? (input.properties as Record<string, unknown>)
            : {};
        const roadmap =
          (typeof props.roadmap_card === "string" && props.roadmap_card.trim()) ||
          (typeof props["Roadmap Card"] === "string" && props["Roadmap Card"].trim()) ||
          (typeof input.roadmap_card === "string" && input.roadmap_card.trim()) ||
          "";
        if (!title || !roadmap) {
          return {
            ask:
              "To log a decision I need a one-line *title* and the *Roadmap card* URL (properties.roadmap_card). Optional: Status (Proposed/Accepted/…), Evidence URL (Slack/Figma/Zoom), and a short Why in sections.",
          };
        }
      }
      if (surface === "marketplace") {
        // The fields a row is useless without; the rest are asked for once
        // and may legitimately be absent (`tool-definitions.json`).
        const props =
          input.properties && typeof input.properties === "object"
            ? (input.properties as Record<string, unknown>)
            : {};
        const has = (name: string) => typeof props[name] === "string" && !!(props[name] as string).trim();
        const missing = [
          !title && "*name*",
          !has("description") && !summary && "*description*",
          !has("stage") && "*stage* (Low-fi · Mid-fi · High-fi)",
          !has("deployment_url") && "*deployment URL*",
        ].filter(Boolean);
        if (missing.length) {
          return { ask: `To publish to the Marketplace I still need the ${missing.join(", ")}.` };
        }
      }

      // Placeholder scan: a genuinely unfilled slot never gets filed, and the
      // refusal names the surface, the field and the text it matched
      // (`agent/placeholder.ts`).
      const placeholder = placeholderRefusal(toolName, input);
      if (placeholder) return { ask: placeholder };

      // Stage, the Project card and Contributors are exact-matched against
      // Notion here, so the question comes back before a card is staged. Run
      // only when the budget covers the worst case (`MARKETPLACE_CHECK_COST`,
      // usually two or three reads); otherwise, or when Notion fails, the
      // publish's own check at execution asks instead.
      if (surface === "marketplace" && budgetHeadroom().subrequests >= MARKETPLACE_CHECK_COST) {
        try {
          const question = await marketplaceQuestion(ctx.env, marketplaceInputOf(input));
          if (question) return { ask: question };
        } catch (err) {
          console.error(`[preflight] marketplace check skipped: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      const sections = Array.isArray(input.sections) ? input.sections : [];
      const sectionStrings = sections.flatMap((s) => {
        if (typeof s === "string") return [s];
        if (s && typeof s === "object") {
          return Object.values(s as Record<string, unknown>).filter(
            (v): v is string => typeof v === "string",
          );
        }
        return [];
      });

      // PRD oversize backstop: thread drafts are for alignment — the document
      // of record lives in Notion and is edited there / in the IDE. Fuller
      // in-thread PRDs are welcome (iterate freely before filing); only a VERY
      // large doc hands off to IDE-expand.
      // dial raised 2026-07-09 — team prefers thorough over fast (user decision)
      const sectionChars = sectionStrings.reduce((n, s) => n + s.length, 0);
      if (surface === "prd" && (summary.length + sectionChars > 12000 || sections.length > 10)) {
        return {
          ask:
            "That PRD is very large for a Slack-filed card — thread drafts are for alignment; the full document of record is edited in Notion or the IDE. " +
            "Two options: I trim it to the essentials, file that card, and hand you a ready-to-paste IDE prompt for `skills/uno-synthesize` to expand it there — or we tighten it together first. Which do you want?",
        };
      }
      return null;
    }

    case "dm_relay": {
      // A relay goes to ONE resolved person. A name is not a recipient: the
      // wrong "Coco" is a DM in the wrong inbox, so resolve it or ask.
      if (!relayRecipientId(input.recipient)) {
        return {
          ask:
            "Who should get this? I need the exact person — tell me who you mean, " +
            "and if the name matches more than one teammate I'll ask which one before staging anything.",
        };
      }
      const text = typeof input.text === "string" ? input.text.trim() : "";
      if (!text) {
        return { ask: "What should the DM say? Give me the message and I'll stage it for your ✅." };
      }
      return null;
    }

    case "github_issue_create": {
      // The repo must be on the Worker's list: an unlisted one is refused here,
      // naming the list, so no card offers a filing the executor would refuse.
      // An omitted repo is the default, which resolves whenever the list parses.
      const target = resolveRepoFor(ctx.env, input.repo);
      if (target.ok) return null;
      // A list that fails to parse offers no repo to choose from, so there is
      // nothing to ask — only a cause, and who can fix it.
      if (target.misconfigured) {
        return { ask: `:x: I can't file a GitHub issue right now — ${target.error} Tell Bill the repo list is broken.` };
      }
      return { ask: `${target.error} Which of those should this intake go on?` };
    }

    case "github_issue_update": {
      // Read as the executor reads it, so no card offers a follow-up the
      // executor would refuse: a triage outcome, nothing to do, a bad number
      // or state. Then the repo, as for an intake.
      const read = issueUpdateFromInput(input);
      if (!read.ok) return { ask: `:x: I can't stage that issue update — ${read.error}.` };
      const target = resolveRepoFor(ctx.env, input.repo);
      if (target.ok) return null;
      if (target.misconfigured) {
        return { ask: `:x: I can't update a GitHub issue right now — ${target.error} Tell Bill the repo list is broken.` };
      }
      return { ask: `${target.error} Which of those is the issue on?` };
    }

    case "github_workflow_run": {
      // Only a workflow the repo list names, on a repo it lists — refused here,
      // naming what IS allowed, so nothing unlisted is ever put on a card.
      const checked = checkWorkflowRun(input, resolveRepoFor(ctx.env, input.repo));
      return checked.ok ? null : { ask: checked.error };
    }

    case "shareout_post": {
      // A shareout needs real substance — don't ping the design channel with a
      // placeholder blurb and nothing to look at.
      const summary = typeof input.summary === "string" ? input.summary.trim() : "";
      if (summary.length < 15) {
        return {
          ask:
            "Before I share this out, give me one or two sentences on *what it is and what feedback you want* (a link to the prototype/frame/PRD helps too).",
        };
      }

      // Bundle policy changed 2026-07-16 (Bill: "stage, but flag gaps loudly"):
      // preflight no longer REJECTS a prototype share-out with missing bundle
      // pieces — the ask-then-stage round-trip read as the bot stonewalling an
      // approval. Staging proceeds with what's in hand, and the confirmation
      // card carries a deterministic bundle audit (proposal-render.ts:
      // shareoutBundleNote) so ✅ is informed consent to post partial.

      // A channel the asker names is checked before any card: they are in
      // it, and the bot can post there (`tools/share-for-feedback.ts`).
      if (input.place === "channel" && ctx.shareout) {
        const decided = await decideShareoutPlace(ctx.env, ctx.shareout.slack, input, ctx.shareout.reads);
        if (!decided.ok) return { ask: decided.refusal };
      }
      return null;
    }

    default:
      return null;
  }
}
