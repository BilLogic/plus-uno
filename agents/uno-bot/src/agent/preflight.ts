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

import type { Env } from "../types";
import { listDsComponents, matchComponent, closestComponents } from "../integrations/ds-components";

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

export async function preflight(
  toolName: string,
  input: Record<string, unknown>,
  ctx: PreflightCtx,
): Promise<PreflightAsk | null> {
  switch (toolName) {
    case "implement": {
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
            ":memo: Before I implement a component I need its *Notion PRD* — the polling bot creates one and posts it in #figma-sync.\n" +
            "• Run `implement` from *that* PRD-notification thread, or\n" +
            "• paste the PRD link here and I'll use it.\n\n" +
            "I won't implement a component without a PRD.",
        };
      }
      return null;
    }

    case "implement_design": {
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

    case "marketplace_add": {
      // Every required metadata field must be present before we open a catalog PR.
      const md = (input.metadata ?? {}) as Record<string, unknown>;
      const required = ["title", "description", "stage", "productPillar", "creators", "repoPath"];
      const missing = required.filter((k) => {
        const v = md[k];
        if (Array.isArray(v)) return v.length === 0;
        return typeof v !== "string" || v.trim() === "";
      });
      if (missing.length > 0) {
        return {
          ask:
            ":shopping_trolley: Before I add a marketplace entry I still need: " +
            missing.map((m) => `*${m}*`).join(", ") +
            ".\nSend those and I'll stage the entry.",
        };
      }
      return null;
    }

    case "create_prd": {
      // Don't file a card off a one-liner — ask for enough substance.
      const title = typeof input.title === "string" ? input.title.trim() : "";
      const summary = typeof input.summary === "string" ? input.summary.trim() : "";
      if (!title || summary.length < 30) {
        return {
          ask:
            ":memo: That PRD is a little thin to file. Give me a clear *title* and a couple of sentences of *summary* (what it is + why), and I'll draft the card.",
        };
      }
      return null;
    }

    case "share_for_feedback": {
      // A shareout needs real substance — don't ping the design channel with a
      // placeholder blurb and nothing to look at.
      const summary = typeof input.summary === "string" ? input.summary.trim() : "";
      if (summary.length < 15) {
        return {
          ask:
            ":mega: Before I share this out, give me one or two sentences on *what it is and what feedback you want* (a link to the prototype/frame/PRD helps too).",
        };
      }
      return null;
    }

    default:
      return null;
  }
}
