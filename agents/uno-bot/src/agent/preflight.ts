// Clarify-vs-act calibration (D3).
//
// Before the Worker stages a side-effect proposal, run a pre-flight check: does
// the tool call carry enough information to be actionable? If not, return an
// `ask` string — the Worker posts it and gathers the missing piece INSTEAD of
// proposing. This keeps the "intentional friction" out of the model's hands:
// gating never depends on Claude remembering to ask. When everything needed is
// present, return null and the proposal proceeds (act when sufficient).
//
// This generalizes the original `implement`-only PRD check.
//
// The one seam beside the tool table that keeps a switch on tool names, and it
// keeps it on purpose (#598): each arm is a SUBSTANCE check — does this
// component exist in the library, does this PRD resolve, is that a real email
// address — not a restatement of which tools are gated, which is the table's
// `access` column. A tool with no arm here is a tool with nothing to check,
// which `default` already says, so a new row needs no edit in this file.

import type { Env } from "../types";
import { listDsComponents, matchComponent, closestComponents } from "../integrations/ds-components";
// Placeholder detection lives next door, import-free, so the loop and a plain
// Node test can both reach it without dragging `Env` behind them.
import { placeholderRefusal } from "./placeholder";
import { relayRecipientId } from "../tools/relayed-dm-render";
import { resolveRepoFor } from "../integrations/github";
import { issueUpdateFromInput } from "../tools/github-issue-update-render";
import { checkWorkflowRun } from "../tools/github-workflow-render";

export interface PreflightCtx {
  env: Env;
  /** Notion PRD resolved from the thread root, if any. */
  prd: { id?: string; url?: string } | null;
  /** For `implement`: the PRD url resolved from the thread or pasted by the designer. */
  implementPrdUrl?: string;
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function preflight(
  toolName: string,
  input: Record<string, unknown>,
  ctx: PreflightCtx,
): Promise<PreflightAsk | null> {
  switch (toolName) {
    case "component_implement": {
      // The component must actually exist in the DS library — R2 staged confirm
      // cards for invented names ("Surface", "SpacingToken"). Fail-open when the
      // list can't be fetched: this is a guard, not a wall.
      const component = typeof input.component === "string" ? input.component.trim() : "";
      const known = await listDsComponents(ctx.env);
      if (component && known && !matchComponent(component, known)) {
        const near = closestComponents(component, known);
        return {
          ask:
            `:mag: I don't find a *${component}* component in the design-system library` +
            (near.length ? ` — closest matches: ${near.map((n) => `\`${n}\``).join(", ")}.` : ".") +
            "\nWhich component did you mean? (If this is genuinely new, it needs a PRD + review first — I won't scaffold a library component from scratch.)",
        };
      }

      // A component implement MUST be tied to a Notion PRD (thread root or pasted).
      if (!ctx.prd?.id && !ctx.implementPrdUrl) {
        return {
          ask:
            ":memo: Before I implement a component I need its *Notion PRD* — the polling bot creates one and posts it in #uno-bot.\n" +
            "• Run `implement` from *that* PRD-notification thread, or\n" +
            "• paste the PRD link here and I'll use it.\n\n" +
            "I won't implement a component without a PRD.",
        };
      }
      return null;
    }

    case "prototype_scaffold": {
      // Need a Figma frame with a specific node selected, else the scaffold has nothing to build.
      const figmaUrl = typeof input.figma_url === "string" ? input.figma_url.trim() : "";
      if (!figmaUrl || !/node-id=/.test(figmaUrl)) {
        return {
          ask:
            ":frame_with_picture: To scaffold a prototype I need a *Figma link with a specific frame selected* — the URL should contain a `node-id`.\n" +
            "Paste that frame link and I'll build straight from it.",
        };
      }
      return null;
    }

    case "notion_create": {
      // Only PRD-shaped surfaces need the substance check — an intake or a
      // decision can legitimately be short.
      const surface = typeof input.surface === "string" ? input.surface.trim().toLowerCase() : "";
      const title = typeof input.title === "string" ? input.title.trim() : "";
      const summary = typeof input.summary === "string" ? input.summary.trim() : "";
      if (surface === "prd" && (!title || summary.length < 30)) {
        return {
          ask:
            ":memo: That PRD is a little thin to file. Give me a clear *title* and a couple of sentences of *summary* (what it is + why), and I'll draft the card.",
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
              ":memo: To log a decision I need a one-line *title* and the *Roadmap card* URL (properties.roadmap_card). Optional: Status (Proposed/Accepted/…), Evidence URL (Slack/Figma/Zoom), and a short Why in sections.",
          };
        }
      }

      // Placeholder scan: a genuinely unfilled slot never gets filed, and the
      // refusal names the surface, the field and the text it matched
      // (`agent/placeholder.ts`).
      const placeholder = placeholderRefusal(toolName, input);
      if (placeholder) return { ask: placeholder };

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
            ":memo: That PRD is very large for a Slack-filed card — thread drafts are for alignment; the full document of record is edited in Notion or the IDE. " +
            "Two options: I trim it to the essentials, file that card, and hand you a ready-to-paste IDE prompt for `skills/uno-synthesize` to expand it there — or we tighten it together first. Which do you want?",
        };
      }
      return null;
    }

    case "email_send": {
      // Sanity only — never invent addresses, never send a stub body.
      const rawRecipients = [
        ...(typeof input.to === "string" ? [input.to] : Array.isArray(input.to) ? input.to : []),
        ...(typeof input.cc === "string" ? [input.cc] : Array.isArray(input.cc) ? input.cc : []),
      ];
      const bad = rawRecipients.filter(
        (r) => typeof r !== "string" || !EMAIL_RE.test(r.trim()),
      );
      if (rawRecipients.length === 0 || bad.length > 0) {
        const badList = bad
          .filter((r): r is string => typeof r === "string")
          .map((r) => `\`${r}\``)
          .join(", ");
        return {
          ask:
            `:e-mail: I can't send that yet — ${rawRecipients.length === 0 ? "there's no recipient" : `these recipients don't look like real email addresses: ${badList || "(non-string values)"}`}. ` +
            "Give me the exact address(es) to send to — I never guess or invent one.",
        };
      }
      const body = typeof input.body === "string" ? input.body.trim() : "";
      if (body.length < 40) {
        return {
          ask:
            ":e-mail: That email body is too thin to send. Write out (or dictate) the full message — a couple of real sentences minimum — and I'll stage it.",
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
            ":incoming_envelope: Who should get this? I need the exact person — tell me who you mean, " +
            "and if the name matches more than one teammate I'll ask which one before staging anything.",
        };
      }
      const text = typeof input.text === "string" ? input.text.trim() : "";
      if (!text) {
        return { ask: ":incoming_envelope: What should the DM say? Give me the message and I'll stage it for your ✅." };
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
      return { ask: `:mag: ${target.error} Which of those should this intake go on?` };
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
      return { ask: `:mag: ${target.error} Which of those is the issue on?` };
    }

    case "github_workflow_run": {
      // Only a workflow the repo list names, on a repo it lists — refused here,
      // naming what IS allowed, so nothing unlisted is ever put on a card.
      const checked = checkWorkflowRun(input, resolveRepoFor(ctx.env, input.repo));
      return checked.ok ? null : { ask: `:gear: ${checked.error}` };
    }

    case "shareout_post": {
      // A shareout needs real substance — don't ping the design channel with a
      // placeholder blurb and nothing to look at.
      const summary = typeof input.summary === "string" ? input.summary.trim() : "";
      if (summary.length < 15) {
        return {
          ask:
            ":mega: Before I share this out, give me one or two sentences on *what it is and what feedback you want* (a link to the prototype/frame/PRD helps too).",
        };
      }

      // Bundle policy changed 2026-07-16 (Bill: "stage, but flag gaps loudly"):
      // preflight no longer REJECTS a prototype share-out with missing bundle
      // pieces — the ask-then-stage round-trip read as the bot stonewalling an
      // approval. Staging proceeds with what's in hand, and the confirmation
      // card carries a deterministic bundle audit (proposal-render.ts:
      // shareoutBundleNote) so ✅ is informed consent to post partial.
      return null;
    }

    default:
      return null;
  }
}
