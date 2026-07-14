// notion_create executor — creates a page/card in a convention Notion surface
// (prd / intake / decision), then posts the link. Side effect → routed through
// the ✅ gate. Marketplace is NOT a surface here — its relation + rollup +
// dual-write shape is an in-IDE writers/notion operation. Component PRDs and
// research notes are not bot surfaces: component PRDs are regular feature PRDs
// on the Roadmap, and deep research is an IDE-only skill that writes to the
// project hub's Research page.

import type { Env } from "../types";
import type { SlackContext } from "./dispatcher";
import { postMessage } from "../slack/api";
import { notionCreate, type NotionCreateSurface, type PrdSection } from "../integrations/notion";

const SURFACES = new Set<NotionCreateSurface>(["prd", "intake", "decision"]);

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function asSections(v: unknown): PrdSection[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((s) => {
      const o = (s ?? {}) as Record<string, unknown>;
      return { heading: asString(o.heading), body: asString(o.body) };
    })
    .filter((s) => s.heading);
}
function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
}

/**
 * Create a Notion page on a convention surface and post the link in-thread.
 * @param env - Worker bindings
 * @param input - Tool args from the model
 * @param slack - Thread context for the outcome message
 */
export async function executeNotionCreate(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  const surface = asString(input.surface).toLowerCase() as NotionCreateSurface;
  const title = asString(input.title);
  if (!SURFACES.has(surface)) {
    return JSON.stringify({ ok: false, error: `unknown or unsupported surface '${surface}'` });
  }
  if (!title) return JSON.stringify({ ok: false, error: "missing 'title'" });

  // Split the model's freeform `properties` into known keys and body extras.
  const props =
    input.properties && typeof input.properties === "object"
      ? (input.properties as Record<string, unknown>)
      : {};
  const productPillar = asString(props.product_pillar) || asString(input.product_pillar);
  const roadmapCard =
    asString(props.roadmap_card) ||
    asString(props["Roadmap Card"]) ||
    asString(input.roadmap_card);
  const decisionStatus =
    asString(props.status) || asString(props.Status) || asString(input.status);
  const evidence =
    asString(props.evidence) ||
    asString(props.Evidence) ||
    asString(input.evidence);
  const extras: Record<string, string> = {};
  for (const [k, v] of Object.entries(props)) {
    const key = k.toLowerCase().replace(/[\s_]+/g, "");
    if (key === "productpillar" || key === "roadmapcard" || key === "status" || key === "evidence") {
      continue;
    }
    if (typeof v === "string" && v.trim()) extras[k] = v.trim();
  }
  if (evidence) extras.evidence = evidence;

  if (surface === "decision" && !roadmapCard) {
    return JSON.stringify({
      ok: false,
      error: "decision requires properties.roadmap_card (Roadmap page URL or id)",
    });
  }

  try {
    const created = await notionCreate(env, surface, {
      title,
      summary: asString(input.summary) || undefined,
      sections: asSections(input.sections),
      acceptanceCriteria: asStringArray(input.acceptance_criteria),
      productPillar: productPillar || undefined,
      sourceUrl: asString(input.source_url) || evidence || undefined,
      extras,
      roadmapCard: roadmapCard || undefined,
      decisionStatus: decisionStatus || undefined,
    });
    await postMessage(env, {
      channel: slack.channel,
      thread_ts: slack.threadTs,
      text: `:memo: Created on *${created.label}*: <${created.url}|${title}>`,
    });
    return JSON.stringify({
      ok: true,
      status: "created",
      surface,
      url: created.url,
      message: `Created '${title}' on ${created.label}.`,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    await postMessage(env, {
      channel: slack.channel,
      thread_ts: slack.threadTs,
      text: `:x: Couldn't create in Notion — ${detail}`,
    });
    return JSON.stringify({ ok: false, status: "notion_failed", detail });
  }
}
