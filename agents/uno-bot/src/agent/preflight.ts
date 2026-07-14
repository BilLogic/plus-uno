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

// ---- cheap, null-safe helpers (inputs are Record<string, unknown>) ----

/** All string values in the payload, one level deep into arrays/objects —
 *  enough to see summary, link, section bodies, recipients. */
function collectStrings(input: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const v of Object.values(input)) {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === "string") out.push(item);
        else if (item && typeof item === "object") {
          for (const nested of Object.values(item as Record<string, unknown>)) {
            if (typeof nested === "string") out.push(nested);
          }
        }
      }
    } else if (v && typeof v === "object") {
      for (const nested of Object.values(v as Record<string, unknown>)) {
        if (typeof nested === "string") out.push(nested);
      }
    }
  }
  return out;
}

const PLACEHOLDER_RE = /\b(TBD|TODO|lorem|placeholder)\b/i;
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

      // Placeholder scan: never file a card with TBD/TODO/lorem/placeholder in
      // it — real content or no card.
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
      const placeholderHits = [title, summary, ...sectionStrings]
        .map((t) => t.match(PLACEHOLDER_RE)?.[0])
        .filter((m): m is string => !!m);
      if (placeholderHits.length > 0) {
        const unique = [...new Set(placeholderHits.map((m) => m.toLowerCase()))];
        return {
          ask:
            `:memo: This card still has placeholder content in it (${unique.map((m) => `\`${m}\``).join(", ")}). ` +
            "Give me the real content for those spots and I'll file it — I won't create a card with placeholders.",
        };
      }

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

      // Bundle check (uno-publish contract): a PROTOTYPE share-out must carry
      // the full bundle — Loom walkthrough + live preview + Decisions DB links.
      // The composing agent is told to gather these; this backstop makes it
      // code-enforced instead of best-effort.
      if (/prototype|prototypes|scaffold/i.test(summary)) {
        const haystack = collectStrings(input).join("\n");
        const missing: string[] = [];
        if (!/https?:\/\/[^\s]*loom\.com/i.test(haystack)) {
          missing.push("a *Loom walkthrough* link (loom.com)");
        }
        if (!/https?:\/\/[^\s]*(netlify\.app|workers\.dev)/i.test(haystack)) {
          missing.push("a *live preview* link (netlify.app / workers.dev)");
        }
        if (!/https?:\/\/[^\s]*(notion\.so|notion\.site|app\.notion\.com)/i.test(haystack)) {
          missing.push("a *Decisions DB / Notion* link (project Decisions view or hub)");
        }
        if (missing.length > 0) {
          return {
            ask:
              ":mega: A prototype share-out posts with the full bundle — this one is missing:\n" +
              missing.map((m) => `• ${m}`).join("\n") +
              "\nDrop those links in and I'll stage the post. (Replica creation + visual diff are IDE work — I only collect the links.)",
          };
        }
      }
      return null;
    }

    default:
      return null;
  }
}
