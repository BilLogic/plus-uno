// notion_create executor — creates a page/card in an allowlisted Notion surface
// (prd / ds-component-prd / intake / research), then posts the link. Side effect
// → routed through the ✅ gate. Marketplace is NOT a surface here — its relation +
// rollup + dual-write shape is an in-IDE writers/notion operation.

import type { Env } from "../types";
import type { SlackContext } from "./dispatcher";
import { postMessage } from "../slack/api";
import { notionCreate, type NotionCreateSurface, type PrdSection } from "../integrations/notion";

const SURFACES = new Set<NotionCreateSurface>(["prd", "ds-component-prd", "intake", "research"]);

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

  // Split the model's freeform `properties` into productPillar (a real property)
  // and everything else (rendered into the body as extras).
  const props =
    input.properties && typeof input.properties === "object"
      ? (input.properties as Record<string, unknown>)
      : {};
  const productPillar = asString(props.product_pillar) || asString(input.product_pillar);
  const extras: Record<string, string> = {};
  for (const [k, v] of Object.entries(props)) {
    if (k.toLowerCase() === "product_pillar") continue;
    if (typeof v === "string" && v.trim()) extras[k] = v.trim();
  }

  try {
    const created = await notionCreate(env, surface, {
      title,
      summary: asString(input.summary) || undefined,
      sections: asSections(input.sections),
      acceptanceCriteria: asStringArray(input.acceptance_criteria),
      productPillar: productPillar || undefined,
      sourceUrl: asString(input.source_url) || undefined,
      extras,
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
